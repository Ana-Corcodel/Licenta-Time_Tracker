from django.urls import path
from django.conf import settings
from django.conf.urls.static import static
from rest_framework.routers import DefaultRouter
from .views import AngajatView, PontajView, TipZiView, StatusView
from .views import CustomAuthTokenView, CookieTokenRefreshView, check_auth


router = DefaultRouter()


urlpatterns = router.urls

urlpatterns += [
    path('api/logare/', CustomAuthTokenView.as_view(), name='logare'),
    path('api/token/refresh/', CookieTokenRefreshView.as_view(), name='token_refresh'),
    path('api/check_auth/', check_auth, name='check_auth'),
    path('status-angajati/', StatusView.as_view(), name='status-angajati-list'),
    path('status-angajati/<int:pk>/', StatusView.as_view(), name='status-angajati-detail'),
    path('angajati/', AngajatView.as_view(), name='angajati-list'),
    path('angajati/<int:pk>/', AngajatView.as_view(), name='angajati-detail'),
    path('pontaje/', PontajView.as_view(), name='pontaje-list'),
    path('pontaje/<int:pk>/', PontajView.as_view(), name='pontaje-detail'),
    path('tipuri-zile/', TipZiView.as_view(), name='tipuri-zile-list'),
    path('tipuri-zile/<int:pk>/', TipZiView.as_view(), name='tipuri-zile-detail'),
] + static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
