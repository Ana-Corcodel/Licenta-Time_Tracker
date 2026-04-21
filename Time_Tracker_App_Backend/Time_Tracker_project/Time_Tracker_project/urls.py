from django.contrib import admin
from django.urls import include, path
from django.conf import settings
from django.conf.urls.static import static
from Time_Tracker_app.views import AngajatView, PontajView, TipZiView

urlpatterns = [
    path('admin/', admin.site.urls),
    path('angajati/', AngajatView.as_view(), name='angajati-list'),
    path('angajati/<int:pk>/', AngajatView.as_view(), name='angajati-detail'),
    path('pontaje/', PontajView.as_view(), name='pontaje-list'),
    path('pontaje/<int:pk>/', PontajView.as_view(), name='pontaje-detail'),
    path('tipuri-zile/', TipZiView.as_view(), name='tipuri-zile-list'),
    path('tipuri-zile/<int:pk>/', TipZiView.as_view(), name='tipuri-zile-detail'),
    path('api/', include('Time_Tracker_app.urls')),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)