from rest_framework import serializers
from .models import Angajat, TipZi, Pontaj, Concediu, ConcediuAttach

class AngajatSerializer(serializers.ModelSerializer):
    are_amprenta = serializers.SerializerMethodField()

    class Meta:
        model = Angajat
        fields = '__all__'
        extra_fields = ['are_amprenta']

    def get_are_amprenta(self, obj):
        return hasattr(obj, 'amprenta')

class TipZiSerializer(serializers.ModelSerializer):
    class Meta:
        model = TipZi
        fields = '__all__'

class PontajSerializer(serializers.ModelSerializer):
    ore_lucrate_format = serializers.SerializerMethodField()
    ore_lucru_suplimentare_format = serializers.SerializerMethodField()

    class Meta:
        model = Pontaj
        fields = '__all__'

    def validate(self, attrs):
        angajat = attrs.get("angajat")
        data = attrs.get("data")
        instance = getattr(self, "instance", None)

        qs = Pontaj.objects.filter(angajat=angajat, data=data)
        if instance:
            qs = qs.exclude(pk=instance.pk)

        pontaj_existent = qs.first()
        if pontaj_existent:
            if pontaj_existent.concediu_id:
                raise serializers.ValidationError(
                    "Angajatul este deja în concediu în această zi și nu se poate adăuga alt pontaj."
                )
            raise serializers.ValidationError(
                "Există deja un pontaj pentru acest angajat în această zi."
            )

        return attrs

    def get_ore_lucrate_format(self, obj):
        return obj.ore_lucrate_hms()

    def get_ore_lucru_suplimentare_format(self, obj):
        return obj.ore_suplimentare_hms()
    
class ConcediuAttachSerializer(serializers.ModelSerializer):
    file_url = serializers.SerializerMethodField()

    class Meta:
        model = ConcediuAttach
        fields = ["id", "file", "filename", "uploaded_at", "file_url"]

    def get_file_url(self, obj):
        request = self.context.get("request")
        if obj.file and hasattr(obj.file, "url"):
            url = obj.file.url
            return request.build_absolute_uri(url) if request else url
        return None

class ConcediuSerializer(serializers.ModelSerializer):
    angajat_label = serializers.SerializerMethodField()
    tip_concediu_label = serializers.SerializerMethodField()
    attach_files = ConcediuAttachSerializer(
        source="attach",
        many=True,
        read_only=True
    )

    class Meta:
        model = Concediu
        fields = "__all__"
        read_only_fields = ["durata", "an_concediu"]

    def validate(self, attrs):
        instance = self.instance

        angajat = attrs.get(
            "angajat",
            instance.angajat if instance else None
        )
        data_start = attrs.get(
            "data_start",
            instance.data_start if instance else None
        )
        data_sfarsit = attrs.get(
            "data_sfarsit",
            instance.data_sfarsit if instance else None
        )

        if data_start and data_sfarsit and data_start > data_sfarsit:
            raise serializers.ValidationError({
                "data_sfarsit": (
                    "Data de sfârșit nu poate fi înaintea datei de început."
                )
            })

        if angajat and data_start and data_sfarsit:
            pontaje_existente = Pontaj.objects.filter(
                angajat=angajat,
                data__range=(data_start, data_sfarsit)
            )

            # La editare ignorăm pontajele generate de concediul actual.
            if instance:
                pontaje_existente = pontaje_existente.exclude(
                    concediu=instance
                )

            if pontaje_existente.exists():
                zile_ocupate = list(
                    pontaje_existente
                    .order_by("data")
                    .values_list("data", flat=True)
                )

                zile_formatate = ", ".join(
                    zi.strftime("%d.%m.%Y")
                    for zi in zile_ocupate
                )

                raise serializers.ValidationError({
                    "non_field_errors": [
                        (
                            "Concediul nu poate fi salvat deoarece există "
                            f"deja pontaj pentru: {zile_formatate}."
                        )
                    ]
                })

        return attrs

    def get_angajat_label(self, obj):
        if obj.angajat:
            return f"{obj.angajat.nume} {obj.angajat.prenume}"
        return ""

    def get_tip_concediu_label(self, obj):
        if obj.tip_concediu:
            return obj.tip_concediu.tip_zi or ""
        return ""