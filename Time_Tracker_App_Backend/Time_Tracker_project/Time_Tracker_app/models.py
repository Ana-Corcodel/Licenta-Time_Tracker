from django.db import models
import os
from django.conf import settings
from datetime import timedelta

class Angajat(models.Model):
    STATUS_CHOICES = [
        ('activ', 'Activ'),
        ('inactiv', 'Inactiv'),
        ('suspendat', 'Suspendat'),
    ]
    
    nume = models.CharField(max_length=100)
    prenume = models.CharField(max_length=100)
    functie = models.CharField(max_length=100)
    telefon = models.CharField(max_length=20, blank=True, null=True)
    adresa = models.CharField(max_length=255, blank=True, null=True)
    email = models.EmailField(blank=True, null=True)
    locatie = models.TextField(blank=True, null=True)
    ora_incepere = models.TimeField(blank=False, null=False)
    ora_sfarsit = models.TimeField(blank=False, null=False)
    ora_pauza = models.IntegerField(help_text="Durata pauzei în minute")
    status = models.CharField(
        max_length=10, 
        choices=STATUS_CHOICES, 
        default='activ'
    )

    def folder_path(self):
        """Returnează calea completă a folderului angajatului"""
        safe_name = f"{self.nume}_{self.prenume}".replace(" ", "_")
        return os.path.join(settings.BASE_DIR, "timetracker", "angajati", safe_name)

    def save(self, *args, **kwargs):
        super().save(*args, **kwargs)
        os.makedirs(self.folder_path(), exist_ok=True)

    def delete(self, *args, **kwargs):
        import shutil
        folder = self.folder_path()
        if os.path.exists(folder):
            shutil.rmtree(folder)
        super().delete(*args, **kwargs)

    def __str__(self):
        return f"{self.nume} {self.prenume} - {self.functie}"


class TipZi(models.Model):
    prescurtare = models.CharField(max_length=10)
    tip_zi = models.CharField(max_length=100)
    este_concediu = models.BooleanField(default=False)  # 👈 asta lipsește

    def __str__(self):
        return f"{self.prescurtare} - {self.tip_zi}"

class Pontaj(models.Model):
    angajat = models.ForeignKey(Angajat, on_delete=models.CASCADE, related_name="pontaje")
    concediu = models.ForeignKey(
        'Concediu',
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name="pontaje_generate"
    )
    luna = models.CharField(max_length=20)
    an = models.DateField()
    ora_start = models.TimeField(null=True, blank=True)
    ora_sfarsit = models.TimeField(null=True, blank=True)
    pauza_masa = models.IntegerField(help_text="Durata pauzei în minute")
    tip = models.ForeignKey(TipZi, on_delete=models.CASCADE, related_name="pontaje")
    data = models.DateField()
    ore_lucrate = models.DecimalField(max_digits=10, decimal_places=6, default=0)
    ore_lucru_suplimentare = models.DecimalField(max_digits=10, decimal_places=6, default=0)

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=["angajat", "data"],
                name="unique_pontaj_per_angajat_pe_zi"
            )
        ]

    def __str__(self):
        return f"{self.angajat} - {self.data} ({self.tip.prescurtare})"

    def ore_lucrate_hms(self):
        total_secunde = int(round(float(self.ore_lucrate) * 3600))
        ore = total_secunde // 3600
        minute = (total_secunde % 3600) // 60
        secunde = total_secunde % 60
        return f"{ore}:{minute:02d}:{secunde:02d}"

    def ore_suplimentare_hms(self):
        total_secunde = int(round(float(self.ore_lucru_suplimentare) * 3600))
        ore = total_secunde // 3600
        minute = (total_secunde % 3600) // 60
        secunde = total_secunde % 60
        return f"{ore}:{minute:02d}:{secunde:02d}"
    
class Amprenta(models.Model):
    angajat = models.OneToOneField(Angajat, on_delete=models.CASCADE)
    fingerprint_id = models.PositiveIntegerField(unique=True)
    activ = models.BooleanField(default=True)

    def __str__(self):
        return f"{self.angajat} -> ID {self.fingerprint_id}"
    
class CerereAmprenta(models.Model):
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('in_progress', 'In Progress'),
        ('success', 'Success'),
        ('failed', 'Failed'),
    ]

    angajat = models.ForeignKey(Angajat, on_delete=models.CASCADE, related_name='cereri_amprenta')
    fingerprint_id = models.PositiveIntegerField()
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    mesaj = models.CharField(max_length=255, blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.angajat} - {self.fingerprint_id} - {self.status}"
    
class CerereStergereAmprenta(models.Model):
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('in_progress', 'In Progress'),
        ('success', 'Success'),
        ('failed', 'Failed'),
    ]

    angajat = models.ForeignKey(
        Angajat,
        on_delete=models.CASCADE,
        related_name='cereri_stergere_amprenta'
    )
    fingerprint_id = models.PositiveIntegerField()
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    mesaj = models.CharField(max_length=255, blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.angajat} - stergere ID {self.fingerprint_id} - {self.status}"
    
    
def saving_concediu_attachments(instance, filename):
    return os.path.join("documente_concedii", filename)


class ConcediuAttach(models.Model):
    file = models.FileField(upload_to=saving_concediu_attachments)
    uploaded_at = models.DateTimeField(auto_now_add=True)
    filename = models.CharField(max_length=255, blank=True)

    def save(self, *args, **kwargs):
        if not self.filename and self.file:
            self.filename = self.file.name
        super().save(*args, **kwargs)

    def __str__(self):
        return self.filename or str(self.file)


class Concediu(models.Model):
    angajat = models.ForeignKey(
        Angajat,
        on_delete=models.CASCADE,
        related_name="concedii"
    )
    data_start = models.DateField()
    data_sfarsit = models.DateField()
    durata = models.IntegerField(help_text="Durata concediului în zile")
    an_concediu = models.IntegerField()
    tip_concediu = models.ForeignKey(
        TipZi,
        on_delete=models.CASCADE,
        related_name="concedii"
    )

    attach = models.ManyToManyField("ConcediuAttach", blank=True)

    def save(self, *args, **kwargs):
        if self.data_start and self.data_sfarsit:
            self.durata = (self.data_sfarsit - self.data_start).days + 1

        if self.data_start:
            self.an_concediu = self.data_start.year

        este_update = self.pk is not None

        super().save(*args, **kwargs)

        if este_update:
            self.pontaje_generate.all().delete()

        current_date = self.data_start
        while current_date <= self.data_sfarsit:
            Pontaj.objects.create(
                angajat=self.angajat,
                concediu=self,
                luna={
                    1: "Ianuarie",
                    2: "Februarie",
                    3: "Martie",
                    4: "Aprilie",
                    5: "Mai",
                    6: "Iunie",
                    7: "Iulie",
                    8: "August",
                    9: "Septembrie",
                    10: "Octombrie",
                    11: "Noiembrie",
                    12: "Decembrie",
                }[current_date.month],
                an=current_date,
                ora_start=None,
                ora_sfarsit=None,
                pauza_masa=0,
                tip=self.tip_concediu,
                data=current_date,
                ore_lucrate=0,
                ore_lucru_suplimentare=0
            )
            current_date += timedelta(days=1)

    def delete(self, *args, **kwargs):
        self.pontaje_generate.all().delete()
        super().delete(*args, **kwargs)

    def __str__(self):
        return f"{self.angajat} - {self.tip_concediu}"