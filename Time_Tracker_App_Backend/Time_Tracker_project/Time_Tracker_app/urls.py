from django.urls import path
from django.conf import settings
from django.conf.urls.static import static
from rest_framework.routers import DefaultRouter
from .views import AngajatView, PontajView, TipZiView, StatusView, logare, pagina_protejata, utilizator_curent, logout_view, scan_fingerprint


router = DefaultRouter()


urlpatterns = router.urls

urlpatterns += [
    path('status-angajati/', StatusView.as_view(), name='status-angajati-list'),
    path('status-angajati/<int:pk>/', StatusView.as_view(), name='status-angajati-detail'),
    path('angajati/', AngajatView.as_view(), name='angajati-list'),
    path('angajati/<int:pk>/', AngajatView.as_view(), name='angajati-detail'),
    path('pontaje/', PontajView.as_view(), name='pontaje-list'),
    path('pontaje/<int:pk>/', PontajView.as_view(), name='pontaje-detail'),
    path('tipuri-zile/', TipZiView.as_view(), name='tipuri-zile-list'),
    path('tipuri-zile/<int:pk>/', TipZiView.as_view(), name='tipuri-zile-detail'),
    path("logare/", logare),
    path("logout/", logout_view),
    path("utilizator-curent/", utilizator_curent),
    path("pagina-protejata/", pagina_protejata),
    path('scan-fingerprint/', scan_fingerprint, name='scan-fingerprint'),
] + static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
