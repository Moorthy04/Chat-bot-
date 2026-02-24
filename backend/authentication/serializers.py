from django.contrib.auth.models import User
from rest_framework import serializers

from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from django.db.models import Q

class UserSerializer(serializers.ModelSerializer):
    name = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ('id', 'username', 'email', 'name')

    def get_name(self, obj):
        return obj.username

class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    def validate(self, attrs):
        # Allow login using either username or email
        identifier = attrs.get('username')
        password = attrs.get('password')

        user = User.objects.filter(Q(username=identifier) | Q(email=identifier)).first()
        
        if user and user.check_password(password):
            attrs['username'] = user.username
            return super().validate(attrs)
        
        raise serializers.ValidationError('No active account found with the given credentials')

class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)

    class Meta:
        model = User
        fields = ('username', 'email', 'password')

    def create(self, validated_data):
        user = User.objects.create_user(
            username=validated_data['username'],
            email=validated_data['email'],
            password=validated_data['password']
        )
        return user
