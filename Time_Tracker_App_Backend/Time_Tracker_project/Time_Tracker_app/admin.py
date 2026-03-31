from django.contrib import admin
from .models import Angajat, TipZi, Pontaj, Amprenta, CerereAmprenta, CerereStergereAmprenta

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
        'data',
        'ora_start',
        'ora_sfarsit',
        'pauza_masa',
        'afiseaza_ore_lucrate',
        'afiseaza_ore_suplimentare',
    )

    def afiseaza_ore_lucrate(self, obj):
        return obj.ore_lucrate_hms()
    afiseaza_ore_lucrate.short_description = 'Ore lucrate'

    def afiseaza_ore_suplimentare(self, obj):
        return obj.ore_suplimentare_hms()
    afiseaza_ore_suplimentare.short_description = 'Ore suplimentare'
    
admin.site.register(Amprenta)
admin.site.register(CerereAmprenta)
admin.site.register(CerereStergereAmprenta)