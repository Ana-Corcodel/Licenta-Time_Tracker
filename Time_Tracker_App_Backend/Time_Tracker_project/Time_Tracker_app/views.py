from django.shortcuts import render
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from .models import Angajat, Pontaj, TipZi, Status
from .serializers import AngajatSerializer, PontajSerializer, TipZiSerializer, StatusSerializer
from django.shortcuts import get_object_or_404
from django.contrib.auth import login, logout, get_user_model
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, AllowAny
# În views.py, adaugă:

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
    
User = get_user_model()


@api_view(["POST"])
@permission_classes([AllowAny])
def logare(request):
    email = request.data.get("email")
    password = request.data.get("password")

    if not email or not password:
        return Response(
            {"message": "Email și parolă obligatorii"},
            status=status.HTTP_400_BAD_REQUEST
        )

    try:
        user = User.objects.get(email=email)
    except User.DoesNotExist:
        return Response(
            {"message": "Email sau parolă greșite"},
            status=status.HTTP_401_UNAUTHORIZED
        )

    if not user.check_password(password):
        return Response(
            {"message": "Email sau parolă greșite"},
            status=status.HTTP_401_UNAUTHORIZED
        )

    login(request, user)

    return Response({
        "message": "Login reușit",
        "user": {
            "id": user.id,
            "email": user.email,
            "username": user.username
        }
    })


@api_view(["POST"])
def delogare(request):
    logout(request)
    return Response({"message": "Logout reușit"})


@api_view(["GET"])
def utilizator_curent(request):
    if request.user.is_authenticated:
        return Response({
            "autentificat": True,
            "user": {
                "id": request.user.id,
                "email": request.user.email,
                "username": request.user.username
            }
        })

    return Response({"autentificat": False}, status=401)


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def pagina_protejata(request):
    return Response({
        "message": f"Salut {request.user.email}, ești logat!"
    })