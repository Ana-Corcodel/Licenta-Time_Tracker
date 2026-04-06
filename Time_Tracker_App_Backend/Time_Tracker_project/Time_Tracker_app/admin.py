from django.contrib import admin, messages
from .models import (
    Angajat, TipZi, Pontaj,Concediu, Amprenta,
    CerereAmprenta, CerereStergereAmprenta, ConcediuAttach
)


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

@admin.register(Concediu)
class ConcediuAdmin(admin.ModelAdmin):
    list_display = ('angajat', 'data_start')
    search_fields = ('angajat', 'data_start')
    
@admin.register(ConcediuAttach)
class ConcediiAttachAdmin(admin.ModelAdmin):
    list_display = ('file', 'uploaded_at', 'filename')


@admin.register(Amprenta)
class AmprentaAdmin(admin.ModelAdmin):
    list_display = ('angajat', 'fingerprint_id', 'activ')
    search_fields = ('angajat__nume', 'angajat__prenume', 'fingerprint_id')
    list_filter = ('activ',)
    actions = ['porneste_stergerea_din_senzor']

    def delete_model(self, request, obj):
        """
        Când apeși Delete din pagina de detaliu a unei amprente,
        NU o ștergem direct din DB.
        În schimb, creăm cerere de ștergere pentru serial_bridge.
        """
        cerere_existenta = CerereStergereAmprenta.objects.filter(
            angajat=obj.angajat,
            status__in=['pending', 'in_progress']
        ).first()

        if cerere_existenta:
            self.message_user(
                request,
                f'Există deja o cerere activă de ștergere pentru {obj.angajat}.',
                level=messages.WARNING
            )
            return

        CerereStergereAmprenta.objects.create(
            angajat=obj.angajat,
            fingerprint_id=obj.fingerprint_id,
            status='pending',
            mesaj='Cerere de ștergere creată din Django Admin'
        )

        self.message_user(
            request,
            f'A fost pornită cererea de ștergere pentru {obj.angajat} (ID senzor {obj.fingerprint_id}). '
            f'Amprenta va fi ștearsă din baza de date după confirmarea senzorului.',
            level=messages.SUCCESS
        )

    def delete_queryset(self, request, queryset):
        """
        Când selectezi mai multe amprente și dai delete din listă,
        tot nu le ștergem direct.
        Creăm cereri de ștergere pentru fiecare.
        """
        create_count = 0
        skip_count = 0

        for obj in queryset:
            cerere_existenta = CerereStergereAmprenta.objects.filter(
                angajat=obj.angajat,
                status__in=['pending', 'in_progress']
            ).exists()

            if cerere_existenta:
                skip_count += 1
                continue

            CerereStergereAmprenta.objects.create(
                angajat=obj.angajat,
                fingerprint_id=obj.fingerprint_id,
                status='pending',
                mesaj='Cerere de ștergere creată din Django Admin'
            )
            create_count += 1

        if create_count:
            self.message_user(
                request,
                f'Au fost create {create_count} cereri de ștergere.',
                level=messages.SUCCESS
            )

        if skip_count:
            self.message_user(
                request,
                f'{skip_count} amprente au fost omise deoarece aveau deja cerere activă.',
                level=messages.WARNING
            )

    @admin.action(description='Pornește ștergerea din senzor pentru amprentele selectate')
    def porneste_stergerea_din_senzor(self, request, queryset):
        create_count = 0
        skip_count = 0

        for obj in queryset:
            cerere_existenta = CerereStergereAmprenta.objects.filter(
                angajat=obj.angajat,
                status__in=['pending', 'in_progress']
            ).exists()

            if cerere_existenta:
                skip_count += 1
                continue

            CerereStergereAmprenta.objects.create(
                angajat=obj.angajat,
                fingerprint_id=obj.fingerprint_id,
                status='pending',
                mesaj='Cerere de ștergere creată din acțiunea Admin'
            )
            create_count += 1

        if create_count:
            self.message_user(
                request,
                f'Au fost create {create_count} cereri de ștergere.',
                level=messages.SUCCESS
            )

        if skip_count:
            self.message_user(
                request,
                f'{skip_count} amprente au fost omise deoarece aveau deja cerere activă.',
                level=messages.WARNING
            )


@admin.register(CerereAmprenta)
class CerereAmprentaAdmin(admin.ModelAdmin):
    list_display = ('angajat', 'fingerprint_id', 'status', 'mesaj', 'created_at', 'updated_at')
    search_fields = ('angajat__nume', 'angajat__prenume', 'fingerprint_id', 'mesaj')
    list_filter = ('status', 'created_at')


@admin.register(CerereStergereAmprenta)
class CerereStergereAmprentaAdmin(admin.ModelAdmin):
    list_display = ('angajat', 'fingerprint_id', 'status', 'mesaj', 'created_at', 'updated_at')
    search_fields = ('angajat__nume', 'angajat__prenume', 'fingerprint_id', 'mesaj')
    list_filter = ('status', 'created_at')