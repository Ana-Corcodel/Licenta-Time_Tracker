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
    attach_files = ConcediuAttachSerializer(source="attach", many=True, read_only=True)

    class Meta:
        model = Concediu
        fields = "__all__"

    def get_angajat_label(self, obj):
        if obj.angajat:
            return f"{obj.angajat.nume} {obj.angajat.prenume}"
        return ""

    def get_tip_concediu_label(self, obj):
        if obj.tip_concediu:
            return obj.tip_concediu.tip_zi or obj.tip_concediu.denumire or ""
        return ""