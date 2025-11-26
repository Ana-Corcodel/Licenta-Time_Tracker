from django.urls import path
from django.conf import settings
from django.conf.urls.static import static
from rest_framework.routers import DefaultRouter
from .views import AngajatView, PontajView, TipZiView


router = DefaultRouter()


urlpatterns = router.urls

urlpatterns += [
    path('angajati/', AngajatView.as_view(), name='angajati-list'),
    path('angajati/<int:pk>/', AngajatView.as_view(), name='angajati-detail'),
    path('pontaje/', PontajView.as_view(), name='pontaje-list'),
    path('pontaje/<int:pk>/', PontajView.as_view(), name='pontaje-detail'),
    path('tipuri-zile/', TipZiView.as_view(), name='tipuri-zile-list'),
    path('tipuri-zile/<int:pk>/', TipZiView.as_view(), name='tipuri-zile-detail'),
] + static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
