from django.contrib import admin
from .models import Status, Angajat, TipZi, Pontaj


@admin.register(Status)
class StatusAdmin(admin.ModelAdmin):
    list_display = ('descriere',)
    search_fields = ('descriere',)


@admin.register(Angajat)
class AngajatAdmin(admin.ModelAdmin):
    list_display = (
        'nume',
        'prenume',
        'functie',
        'telefon',
        'email',
        'locatie',
        'ora_incepere',
        'ora_sfarsit',
        'ora_pauza',
        'status',
    )
    search_fields = ('nume', 'prenume', 'functie', 'email', 'telefon')
    list_filter = ('functie', 'status')


@admin.register(TipZi)
class TipZiAdmin(admin.ModelAdmin):
    list_display = ('prescurtare', 'tip_zi')
    search_fields = ('prescurtare', 'tip_zi')


@admin.register(Pontaj)
class PontajAdmin(admin.ModelAdmin):
    list_display = (
        'angajat',
        'luna',
        'an',
        'data',
        'ora_start',
        'ora_sfarsit',
        'pauza_masa',
        'ore_lucrate',
        'ore_lucru_suplimentare',
        'tip',
    )
    search_fields = ('angajat', 'luna', 'tip__prescurtare')
    list_filter = ('luna', 'an', 'tip')
