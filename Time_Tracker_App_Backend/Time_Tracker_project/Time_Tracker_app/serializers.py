from rest_framework import serializers
from .models import Status, Angajat, TipZi, Pontaj
from django.contrib.auth import get_user_model
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer

User = get_user_model()

class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    username_field = 'email'

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.fields.pop('username', None)
        self.fields['email'] = serializers.EmailField()
        self.fields['password'] = serializers.CharField(
            write_only=True,
            style={'input_type': 'password'}
        )

    def validate(self, data):
        email = data.get('email')
        password = data.get('password')

        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            raise serializers.ValidationError("User with this email does not exist.")

        if not user.check_password(password):
            raise serializers.ValidationError("Invalid password.")

        return {'user': user}

class StatusSerializer(serializers.ModelSerializer):
    class Meta:
        model = Status
        fields = '__all__'
        
class AngajatSerializer(serializers.ModelSerializer):
    status = serializers.StringRelatedField()
    
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