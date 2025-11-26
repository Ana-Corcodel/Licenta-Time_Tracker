from django.shortcuts import render
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from .models import Angajat, Pontaj, TipZi
from .serializers import AngajatSerializer, PontajSerializer, TipZiSerializer
from django.shortcuts import get_object_or_404


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