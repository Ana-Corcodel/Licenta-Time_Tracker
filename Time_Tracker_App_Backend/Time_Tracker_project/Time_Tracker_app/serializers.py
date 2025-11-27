from rest_framework import serializers
from .models import Angajat, TipZi, Pontaj

class AngajatSerializer(serializers.ModelSerializer):
    class Meta:
        model = Angajat
        fields = '__all__'

class TipZiSerializer(serializers.ModelSerializer):
    class Meta:
        model = TipZi
        fields = '__all__'

class PontajSerializer(serializers.ModelSerializer):
    class Meta:
        model = Pontaj
        fields = '__all__'