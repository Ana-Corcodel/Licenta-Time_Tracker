from django.shortcuts import render
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from .models import Angajat, Pontaj, TipZi, Status, Amprenta
from .serializers import AngajatSerializer, PontajSerializer, TipZiSerializer, StatusSerializer
from django.shortcuts import get_object_or_404
from django.contrib.auth import login, logout, get_user_model
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, AllowAny
from django.views.decorators.csrf import csrf_exempt
from django.http import JsonResponse
import json
from datetime import date, datetime

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
        "autentificat": True,
        "user": {
            "id": user.id,
            "email": user.email,
            "username": user.username
        }
    })


@csrf_exempt
def logout_view(request):
    if request.method != "POST":
        return JsonResponse({"error": "Metoda nepermisă"}, status=405)

    try:
        logout(request)
        return JsonResponse({
            "message": "Logout reușit",
            "autentificat": False
        })
    except Exception as e:
        return JsonResponse({
            "error": str(e)
        }, status=500)


@api_view(["GET"])
@permission_classes([AllowAny])
def utilizator_curent(request):
    if request.user.is_authenticated:
        return Response({
            "autentificat": True,
            "user": {
                "id": request.user.id,
                "email": request.user.email,
                "username": request.user.username,
                "nume": request.user.first_name,
                "prenume": request.user.last_name
            }
        })

    return Response({
        "autentificat": False,
        "user": None
    })

@api_view(["GET"])
@permission_classes([IsAuthenticated])
def pagina_protejata(request):
    return Response({
        "message": f"Salut {request.user.email}, ești logat!"
    })
    
def get_angajat(fingerprint_id):
    try:
        amprenta = Amprenta.objects.select_related('angajat').get(
            fingerprint_id=fingerprint_id,
            activ=True
        )
        return amprenta.angajat
    except Amprenta.DoesNotExist:
        return None

@csrf_exempt
def scan_fingerprint(request):
    if request.method != 'POST':
        return JsonResponse({'error': 'Metoda invalida'}, status=405)

    try:
        data = json.loads(request.body)
        fingerprint_id = int(data.get('fingerprint_id'))
    except Exception:
        return JsonResponse({'error': 'Date invalide'}, status=400)

    angajat = get_angajat(fingerprint_id)

    if angajat:
        return JsonResponse({
            'status': 'success',
            'mesaj': 'Angajat gasit',
            'angajat': {
                'id': angajat.id,
                'nume': angajat.nume,
                'prenume': angajat.prenume,
                'functie': angajat.functie,
            }
        })
    else:
        return JsonResponse({
            'status': 'error',
            'mesaj': 'Amprenta necunoscuta'
        }, status=404)
        
def calculeaza_ore(start_time, end_time, pauza_minute):
    start_dt = datetime.combine(date.today(), start_time)
    end_dt = datetime.combine(date.today(), end_time)

    diferenta = end_dt - start_dt
    minute_totale = int(diferenta.total_seconds() / 60)

    minute_lucrate = max(0, minute_totale - pauza_minute)
    ore_lucrate = minute_lucrate // 60

    return ore_lucrate

@csrf_exempt
def scan_fingerprint(request):
    if request.method != 'POST':
        return JsonResponse({'error': 'Metoda invalida'}, status=405)

    try:
        data = json.loads(request.body)
        fingerprint_id = int(data.get('fingerprint_id'))
    except Exception:
        return JsonResponse({'error': 'Date invalide'}, status=400)

    angajat = get_angajat(fingerprint_id)

    if not angajat:
        return JsonResponse({
            'status': 'error',
            'mesaj': 'Amprenta necunoscuta'
        }, status=404)

    if angajat.status != 'activ':
        return JsonResponse({
            'status': 'error',
            'mesaj': f'Angajatul este {angajat.status}'
        }, status=403)

    azi = date.today()
    ora_acum = datetime.now().time()

    tip_zi, _ = TipZi.objects.get_or_create(
        prescurtare='L',
        defaults={'tip_zi': 'Lucrata'}
    )

    pontaj = Pontaj.objects.filter(
        angajat=angajat,
        data=azi
    ).first()

    if pontaj is None:
        pontaj = Pontaj.objects.create(
            angajat=angajat,
            luna=azi.strftime('%B'),
            an=azi,
            ora_start=ora_acum,
            ora_sfarsit=ora_acum,
            pauza_masa=angajat.ora_pauza,
            tip=tip_zi,
            data=azi,
            ore_lucrate=0,
            ore_lucru_suplimentare=0
        )

        return JsonResponse({
            'status': 'success',
            'tip_actiune': 'checkin',
            'mesaj': 'Intrare inregistrata',
            'angajat': {
                'id': angajat.id,
                'nume': angajat.nume,
                'prenume': angajat.prenume,
                'functie': angajat.functie,
            },
            'pontaj': {
                'data': str(pontaj.data),
                'ora_start': pontaj.ora_start.strftime('%H:%M:%S'),
            }
        })

    if pontaj.ora_start == pontaj.ora_sfarsit and pontaj.ore_lucrate == 0:
        pontaj.ora_sfarsit = ora_acum

        ore_lucrate = calculeaza_ore(
            pontaj.ora_start,
            pontaj.ora_sfarsit,
            pontaj.pauza_masa
        )

        pontaj.ore_lucrate = ore_lucrate

        program_final = datetime.combine(azi, angajat.ora_sfarsit)
        iesire_actuala = datetime.combine(azi, pontaj.ora_sfarsit)

        minute_extra = max(
            0,
            int((iesire_actuala - program_final).total_seconds() / 60)
        )
        pontaj.ore_lucru_suplimentare = minute_extra // 60

        pontaj.save()

        return JsonResponse({
            'status': 'success',
            'tip_actiune': 'checkout',
            'mesaj': 'Iesire inregistrata',
            'angajat': {
                'id': angajat.id,
                'nume': angajat.nume,
                'prenume': angajat.prenume,
                'functie': angajat.functie,
            },
            'pontaj': {
                'data': str(pontaj.data),
                'ora_start': pontaj.ora_start.strftime('%H:%M:%S'),
                'ora_sfarsit': pontaj.ora_sfarsit.strftime('%H:%M:%S'),
                'ore_lucrate': pontaj.ore_lucrate,
                'ore_lucru_suplimentare': pontaj.ore_lucru_suplimentare,
            }
        })

    return JsonResponse({
        'status': 'info',
        'mesaj': 'Pontajul pe azi este deja complet'
    })