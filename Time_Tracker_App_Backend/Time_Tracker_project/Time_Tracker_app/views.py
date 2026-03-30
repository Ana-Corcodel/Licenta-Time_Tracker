from django.shortcuts import render, get_object_or_404
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from .models import Angajat, Pontaj, TipZi, Status, Amprenta, CerereAmprenta
from .serializers import AngajatSerializer, PontajSerializer, TipZiSerializer, StatusSerializer
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
            return Response(
                {"message": "Status creat cu succes", "data": serializer.data},
                status=status.HTTP_201_CREATED
            )
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
            serializer.save()
            return Response(
                {"message": "Angajat creat cu succes", "data": serializer.data},
                status=status.HTTP_201_CREATED
            )
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
            return Response(
                {"message": "Tip de zi creat cu succes", "data": serializer.data},
                status=status.HTTP_201_CREATED
            )
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
            return Response(
                {"message": "Pontaj creat cu succes", "data": serializer.data},
                status=status.HTTP_201_CREATED
            )
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


def get_next_fingerprint_id():
    used_ids = set(Amprenta.objects.values_list('fingerprint_id', flat=True))
    for i in range(1, 128):
        if i not in used_ids:
            return i
    return None


def calculeaza_secunde_lucrate(start_time, end_time, pauza_minute):
    start_dt = datetime.combine(date.today(), start_time)
    end_dt = datetime.combine(date.today(), end_time)

    diferenta = end_dt - start_dt
    secunde_totale = int(diferenta.total_seconds())

    secunde_pauza = pauza_minute * 60
    secunde_lucrate = max(0, secunde_totale - secunde_pauza)

    return secunde_lucrate


def secunde_in_ore_zecimale(secunde):
    return round(secunde / 3600, 6)


def secunde_in_format_hms(secunde):
    ore = secunde // 3600
    minute = (secunde % 3600) // 60
    secunde_ramase = secunde % 60
    return f"{ore}:{minute:02d}:{secunde_ramase:02d}"


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

        secunde_lucrate = calculeaza_secunde_lucrate(
            pontaj.ora_start,
            pontaj.ora_sfarsit,
            pontaj.pauza_masa
        )

        pontaj.ore_lucrate = secunde_in_ore_zecimale(secunde_lucrate)

        program_final = datetime.combine(azi, angajat.ora_sfarsit)
        iesire_actuala = datetime.combine(azi, pontaj.ora_sfarsit)

        secunde_extra = max(
            0,
            int((iesire_actuala - program_final).total_seconds())
        )

        pontaj.ore_lucru_suplimentare = secunde_in_ore_zecimale(secunde_extra)

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
                'ore_lucrate': secunde_in_format_hms(secunde_lucrate),
                'ore_lucru_suplimentare': secunde_in_format_hms(secunde_extra),
            }
        })

    return JsonResponse({
        'status': 'info',
        'mesaj': 'Pontajul pe azi este deja complet'
    })


@csrf_exempt
def start_enroll(request):
    if request.method != 'POST':
        return JsonResponse({'error': 'Metoda invalida'}, status=405)

    try:
        data = json.loads(request.body)
        angajat_id = int(data.get('angajat_id'))
    except Exception:
        return JsonResponse({'error': 'Date invalide'}, status=400)

    angajat = Angajat.objects.filter(id=angajat_id).first()
    if not angajat:
        return JsonResponse({'error': 'Angajat inexistent'}, status=404)

    if Amprenta.objects.filter(angajat=angajat).exists():
        return JsonResponse({'error': 'Angajatul are deja o amprenta'}, status=400)

    cerere_existenta = CerereAmprenta.objects.filter(
        angajat=angajat,
        status__in=['pending', 'in_progress']
    ).first()

    if cerere_existenta:
        return JsonResponse({
            'error': 'Exista deja o cerere activa pentru acest angajat',
            'cerere_id': cerere_existenta.id
        }, status=400)

    fingerprint_id = get_next_fingerprint_id()
    if not fingerprint_id:
        return JsonResponse({'error': 'Nu mai exista ID-uri libere'}, status=400)

    cerere = CerereAmprenta.objects.create(
        angajat=angajat,
        fingerprint_id=fingerprint_id,
        status='pending',
        mesaj='Cererea de inrolare a fost creata'
    )

    return JsonResponse({
        'status': 'success',
        'cerere_id': cerere.id,
        'fingerprint_id': fingerprint_id,
        'mesaj': 'Cererea de inrolare a fost pornita'
    })


def enroll_status(request, cerere_id):
    cerere = CerereAmprenta.objects.select_related('angajat').filter(id=cerere_id).first()
    if not cerere:
        return JsonResponse({'error': 'Cerere inexistenta'}, status=404)

    return JsonResponse({
        'id': cerere.id,
        'status': cerere.status,
        'mesaj': cerere.mesaj,
        'fingerprint_id': cerere.fingerprint_id,
        'angajat': {
            'id': cerere.angajat.id,
            'nume': cerere.angajat.nume,
            'prenume': cerere.angajat.prenume,
        }
    })


@csrf_exempt
def get_pending_enroll(request):
    if request.method != 'GET':
        return JsonResponse({'error': 'Metoda invalida'}, status=405)

    cerere = CerereAmprenta.objects.select_related('angajat').filter(
        status='pending'
    ).order_by('created_at').first()

    if not cerere:
        return JsonResponse({'status': 'empty'})

    cerere.status = 'in_progress'
    cerere.mesaj = 'Se asteapta interactiunea cu senzorul'
    cerere.save()

    return JsonResponse({
        'status': 'success',
        'cerere_id': cerere.id,
        'fingerprint_id': cerere.fingerprint_id,
        'angajat': {
            'id': cerere.angajat.id,
            'nume': cerere.angajat.nume,
            'prenume': cerere.angajat.prenume,
        }
    })


@csrf_exempt
def update_enroll_status(request, cerere_id):
    if request.method != 'POST':
        return JsonResponse({'error': 'Metoda invalida'}, status=405)

    cerere = CerereAmprenta.objects.select_related('angajat').filter(id=cerere_id).first()
    if not cerere:
        return JsonResponse({'error': 'Cerere inexistenta'}, status=404)

    try:
        data = json.loads(request.body)
        new_status = data.get('status')
        mesaj = data.get('mesaj', '')
    except Exception:
        return JsonResponse({'error': 'Date invalide'}, status=400)

    if new_status not in ['in_progress', 'success', 'failed']:
        return JsonResponse({'error': 'Status invalid'}, status=400)

    cerere.status = new_status
    cerere.mesaj = mesaj
    cerere.save()

    if new_status == 'success':
        if not Amprenta.objects.filter(angajat=cerere.angajat).exists():
            Amprenta.objects.create(
                angajat=cerere.angajat,
                fingerprint_id=cerere.fingerprint_id,
                activ=True
            )

    return JsonResponse({'status': 'ok'})