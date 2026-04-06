from django.urls import path
from django.conf import settings
from django.conf.urls.static import static
from rest_framework.routers import DefaultRouter
from .views import AngajatView, PontajView, TipZiView, ConcediuView, ConcediuAttachView, logare, pagina_protejata, utilizator_curent, logout_view, scan_fingerprint, start_enroll, enroll_status, get_pending_enroll, update_enroll_status, get_pending_delete, start_delete_fingerprint, update_delete_status, delete_status


router = DefaultRouter()


urlpatterns = router.urls

urlpatterns += [
    path('angajati/', AngajatView.as_view(), name='angajati-list'),
    path('angajati/<int:pk>/', AngajatView.as_view(), name='angajati-detail'),
    path('pontaje/', PontajView.as_view(), name='pontaje-list'),
    path('pontaje/<int:pk>/', PontajView.as_view(), name='pontaje-detail'),
    path('tipuri-zile/', TipZiView.as_view(), name='tipuri-zile-list'),
    path('tipuri-zile/<int:pk>/', TipZiView.as_view(), name='tipuri-zile-detail'),
    path('concedii/', ConcediuView.as_view(), name='concedii-list'),
    path('concedii/<int:pk>/', ConcediuView.as_view(), name='concedii-detail'),
    path("concedii-attach/", ConcediuAttachView.as_view(), name='concedii-attach-list'),
    path("concedii-attach/<int:pk>/", ConcediuAttachView.as_view(), name='concedii-attach-list'),
    path("logare/", logare),
    path("logout/", logout_view),
    path("utilizator-curent/", utilizator_curent),
    path("pagina-protejata/", pagina_protejata),
    path('scan-fingerprint/', scan_fingerprint, name='scan-fingerprint'),
    path('start-enroll/', start_enroll, name='start-enroll'),
    path('enroll-status/<int:cerere_id>/', enroll_status, name='enroll-status'),
    path('enroll-pending/', get_pending_enroll, name='enroll-pending'),
    path('enroll-update/<int:cerere_id>/', update_enroll_status, name='enroll-update'),
    path('start-delete-fingerprint/', start_delete_fingerprint, name='start_delete_fingerprint'),
    path('delete-pending/', get_pending_delete, name='get_pending_delete'),
    path('delete-update/<int:cerere_id>/', update_delete_status, name='update_delete_status'),
    path('delete-status/<int:cerere_id>/', delete_status),
] + static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
