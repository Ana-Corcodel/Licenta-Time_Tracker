from rest_framework import serializers
from .models import Status, Angajat, TipZi, Pontaj

class StatusSerializer(serializers.ModelSerializer):
    class Meta:
        model = Status
        fields = '__all__'
        
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