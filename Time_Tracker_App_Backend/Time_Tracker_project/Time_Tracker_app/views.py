from django.shortcuts import render
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from .models import Angajat, Pontaj, TipZi, Status
from .serializers import AngajatSerializer, PontajSerializer, TipZiSerializer, StatusSerializer
from django.shortcuts import get_object_or_404
from rest_framework.permissions import AllowAny
from rest_framework.decorators import api_view, permission_classes
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from django.conf import settings
from django.middleware.csrf import get_token
from django.http import JsonResponse

from .serializers import CustomTokenObtainPairSerializer

class CustomAuthTokenView(TokenObtainPairView):
    permission_classes = [AllowAny]

    def post(self, request, *args, **kwargs):
        serializer = CustomTokenObtainPairSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        user = serializer.validated_data['user']
        refresh = RefreshToken.for_user(user)

        refresh_token = str(refresh)
        access_token = str(refresh.access_token)

        response = Response({
            "message": "Login successful"
        })

        response.set_cookie(
            key=settings.SIMPLE_JWT["AUTH_COOKIE_ACCESS"],
            value=access_token,
            domain=settings.SIMPLE_JWT["AUTH_COOKIE_DOMAIN"],
            path=settings.SIMPLE_JWT["AUTH_COOKIE_PATH"],
            expires=settings.SIMPLE_JWT["ACCESS_TOKEN_LIFETIME"],
            secure=settings.SIMPLE_JWT["AUTH_COOKIE_SECURE"],
            httponly=settings.SIMPLE_JWT["AUTH_COOKIE_HTTP_ONLY"],
            samesite=settings.SIMPLE_JWT["AUTH_COOKIE_SAMESITE"],
            max_age=int(settings.SIMPLE_JWT["ACCESS_TOKEN_LIFETIME"].total_seconds()),  # MODIFICAT
        )

        response.set_cookie(
            key=settings.SIMPLE_JWT["AUTH_COOKIE_REFRESH"],
            value=refresh_token,
            domain=settings.SIMPLE_JWT["AUTH_COOKIE_DOMAIN"],
            path=settings.SIMPLE_JWT["AUTH_COOKIE_PATH"],
            expires=settings.SIMPLE_JWT["REFRESH_TOKEN_LIFETIME"],
            secure=settings.SIMPLE_JWT["AUTH_COOKIE_SECURE"],
            httponly=settings.SIMPLE_JWT["AUTH_COOKIE_HTTP_ONLY"],
            samesite=settings.SIMPLE_JWT["AUTH_COOKIE_SAMESITE"],
            max_age=int(settings.SIMPLE_JWT["REFRESH_TOKEN_LIFETIME"].total_seconds()),  # MODIFICAT
        )

        get_token(request)
        return response
    
class CookieTokenRefreshView(TokenRefreshView):
    def post(self, request, *args, **kwargs):
        refresh_token = request.COOKIES.get('refresh_token')

        if not refresh_token:
            return Response(
                {'error': 'No refresh token provided'},
                status=status.HTTP_401_UNAUTHORIZED
            )

        serializer = self.get_serializer(data={'refresh': refresh_token})
        serializer.is_valid(raise_exception=True)

        token_data = serializer.validated_data
        access_token = token_data['access']

        response = Response({'success': True})
        response.set_cookie(
            key=settings.SIMPLE_JWT["AUTH_COOKIE_ACCESS"],
            value=access_token,
            domain=settings.SIMPLE_JWT["AUTH_COOKIE_DOMAIN"],
            path=settings.SIMPLE_JWT["AUTH_COOKIE_PATH"],
            expires=settings.SIMPLE_JWT["ACCESS_TOKEN_LIFETIME"],
            secure=settings.SIMPLE_JWT["AUTH_COOKIE_SECURE"],
            httponly=settings.SIMPLE_JWT["AUTH_COOKIE_HTTP_ONLY"],
            samesite=settings.SIMPLE_JWT["AUTH_COOKIE_SAMESITE"],
        )
        return response
    
@api_view(['GET'])
@permission_classes([AllowAny])
def check_auth(request):
    return JsonResponse({
        'authenticated': request.user.is_authenticated,
        'username': request.user.username if request.user.is_authenticated else None,
    })

class StatusView(APIView):
    def get(self, request, pk=None):
        if pk:
            status_obj = get_object_or_404(Status, pk=pk)
            serializer = StatusSerializer(status_obj)
            return Response(serializer.data)
        else:
            statusuri = Status.objects.all()
            serializer = StatusSerializer(statusuri, many=True)
            return Response(serializer.data)
    
    def post(self, request):
        serializer = StatusSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response({"message": "Status creat cu succes", "data": serializer.data}, 
                           status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    def put(self, request, pk):
        status_obj = get_object_or_404(Status, pk=pk)
        serializer = StatusSerializer(status_obj, data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response({"message": "Status actualizat", "data": serializer.data})
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    def delete(self, request, pk):
        status_obj = get_object_or_404(Status, pk=pk)
        status_obj.delete()
        return Response({"message": "Status șters cu succes"}, status=status.HTTP_204_NO_CONTENT)

class AngajatView(APIView):
    def get(self, request, pk=None):
        if pk:
            angajat = get_object_or_404(Angajat, pk=pk)
            serializer = AngajatSerializer(angajat)
            return Response(serializer.data)
        else:
            angajati = Angajat.objects.all()
            serializer = AngajatSerializer(angajati, many=True)
            return Response(serializer.data)

    def post(self, request):
        serializer = AngajatSerializer(data=request.data)
        if serializer.is_valid():
            angajat = serializer.save()
            return Response({"message": "Angajat creat cu succes", "data": serializer.data}, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def put(self, request, pk):
        angajat = get_object_or_404(Angajat, pk=pk)
        serializer = AngajatSerializer(angajat, data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response({"message": "Angajat actualizat", "data": serializer.data})
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, pk):
        angajat = get_object_or_404(Angajat, pk=pk)
        angajat.delete()
        return Response({"message": "Angajat șters cu succes"}, status=status.HTTP_204_NO_CONTENT)


class TipZiView(APIView):
    def get(self, request, pk=None):
        if pk:
            tip = get_object_or_404(TipZi, pk=pk)
            serializer = TipZiSerializer(tip)
            return Response(serializer.data)
        tips = TipZi.objects.all()
        serializer = TipZiSerializer(tips, many=True)
        return Response(serializer.data)

    def post(self, request):
        serializer = TipZiSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response({"message": "Tip de zi creat cu succes", "data": serializer.data},
                            status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def put(self, request, pk):
        tip = get_object_or_404(TipZi, pk=pk)
        serializer = TipZiSerializer(tip, data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response({"message": "Tip de zi actualizat", "data": serializer.data})
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, pk):
        tip = get_object_or_404(TipZi, pk=pk)
        tip.delete()
        return Response({"message": "Tip de zi șters cu succes"}, status=status.HTTP_204_NO_CONTENT)


class PontajView(APIView):
    def get(self, request, pk=None):
        if pk:
            pontaj = get_object_or_404(Pontaj, pk=pk)
            serializer = PontajSerializer(pontaj)
            return Response(serializer.data)
        pontaje = Pontaj.objects.all()
        serializer = PontajSerializer(pontaje, many=True)
        return Response(serializer.data)

    def post(self, request):
        serializer = PontajSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response({"message": "Pontaj creat cu succes", "data": serializer.data},
                            status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def put(self, request, pk):
        pontaj = get_object_or_404(Pontaj, pk=pk)
        serializer = PontajSerializer(pontaj, data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response({"message": "Pontaj actualizat", "data": serializer.data})
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, pk):
        pontaj = get_object_or_404(Pontaj, pk=pk)
        pontaj.delete()
        return Response({"message": "Pontaj șters cu succes"}, status=status.HTTP_204_NO_CONTENT)