from rest_framework import serializers
from .models import Status, Angajat, TipZi, Pontaj

class StatusSerializer(serializers.ModelSerializer):
    class Meta:
        model = Status
        fields = '__all__'
        
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