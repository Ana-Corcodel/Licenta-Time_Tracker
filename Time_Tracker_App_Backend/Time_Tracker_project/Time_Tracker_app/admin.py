from django.contrib import admin
from .models import Status, Angajat, TipZi, Pontaj, Amprenta


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
        'data',
        'ora_start',
        'ora_sfarsit',
        'pauza_masa',
        'ore_lucrate_formatate',
        'ore_suplimentare_formatate',
    )

    def ore_lucrate_formatate(self, obj):
        return obj.format_ore_lucrate()
    ore_lucrate_formatate.short_description = 'Ore lucrate'

    def ore_suplimentare_formatate(self, obj):
        return obj.format_ore_suplimentare()
    ore_suplimentare_formatate.short_description = 'Ore supl.'

admin.site.register(Amprenta)