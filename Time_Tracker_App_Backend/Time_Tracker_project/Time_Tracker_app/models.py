from django.db import models
import os
from django.conf import settings


class Status(models.Model):
    descriere = models.CharField(max_length=50, unique=True)

    def __str__(self):
        return self.descriere


class Angajat(models.Model):
    nume = models.CharField(max_length=100)
    prenume = models.CharField(max_length=100)
    functie = models.CharField(max_length=100)
    telefon = models.CharField(max_length=20, blank=True, null=True)
    adresa = models.CharField(max_length=255, blank=True, null=True)
    email = models.EmailField(blank=True, null=True)
    locatie = models.TextField(blank=True, null=True)
    ora_incepere = models.TimeField()
    ora_sfarsit = models.TimeField()
    ora_pauza = models.IntegerField(help_text="Durata pauzei în minute")
    status = models.ForeignKey(Status, on_delete=models.CASCADE, related_name="angajati")

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

    def __str__(self):
        return f"{self.prescurtare} - {self.tip_zi}"


class Pontaj(models.Model):
    angajat = models.ForeignKey(Angajat,on_delete=models.CASCADE,related_name="pontaje")
    luna = models.CharField(max_length=20)
    an = models.DateField()
    ora_start = models.TimeField()
    ora_sfarsit = models.TimeField()
    pauza_masa = models.IntegerField(help_text="Durata pauzei în minute")
    tip = models.ForeignKey(TipZi, on_delete=models.CASCADE, related_name="pontaje")
    data = models.DateField()
    ore_lucrate = models.IntegerField()
    ore_lucru_suplimentare = models.IntegerField()

    def __str__(self):
        return f"{self.angajat} - {self.data} ({self.tip.prescurtare})"