import serial
import requests
import time

SERIAL_PORT = 'COM6'
BAUD_RATE = 9600

DJANGO_BASE_URL = 'http://127.0.0.1:8000/api'
SCAN_URL = f'{DJANGO_BASE_URL}/scan-fingerprint/'
ENROLL_PENDING_URL = f'{DJANGO_BASE_URL}/enroll-pending/'
DELETE_PENDING_URL = f'{DJANGO_BASE_URL}/delete-pending/'


def trimite_display(ser, linia1, linia2):
    mesaj = f"LCD:{linia1}|{linia2}\n"
    ser.write(mesaj.encode('utf-8'))
    print("Trimis la Arduino:", mesaj.strip())


def afiseaza_temporar(ser, linia1, linia2, stare_display, durata=2):
    trimite_display(ser, linia1, linia2)
    stare_display["reset_la"] = time.time() + durata
    stare_display["activ"] = True


def trimite_enroll(ser, fingerprint_id):
    mesaj = f"ENROLL:{fingerprint_id}\n"
    ser.write(mesaj.encode('utf-8'))
    print("Trimis la Arduino:", mesaj.strip())


def trimite_delete(ser, fingerprint_id):
    mesaj = f"DELETE:{fingerprint_id}\n"
    ser.write(mesaj.encode('utf-8'))
    print("Trimis la Arduino:", mesaj.strip())


def actualizeaza_enroll_status(cerere_id, status, mesaj):
    try:
        response = requests.post(
            f"{DJANGO_BASE_URL}/enroll-update/{cerere_id}/",
            json={"status": status, "mesaj": mesaj},
            timeout=5
        )
        print(f"Update enroll {cerere_id}: {response.status_code} {response.text}")
    except Exception as e:
        print(f"Eroare la update enroll status: {e}")


def actualizeaza_delete_status(cerere_id, status, mesaj):
    try:
        response = requests.post(
            f"{DJANGO_BASE_URL}/delete-update/{cerere_id}/",
            json={"status": status, "mesaj": mesaj},
            timeout=5
        )
        print(f"Update delete {cerere_id}: {response.status_code} {response.text}")
    except Exception as e:
        print(f"Eroare la update delete status: {e}")


def verifica_cerere_enroll():
    try:
        response = requests.get(ENROLL_PENDING_URL, timeout=5)
        return response.json()
    except Exception as e:
        print(f"Eroare la verificare enroll pending: {e}")
        return {"status": "empty"}


def verifica_cerere_delete():
    try:
        response = requests.get(DELETE_PENDING_URL, timeout=5)
        return response.json()
    except Exception as e:
        print(f"Eroare la verificare delete pending: {e}")
        return {"status": "empty"}


def proceseaza_scanare(line, ser, stare_display):
    try:
        fingerprint_id = int(line.split(":")[1])

        response = requests.post(
            SCAN_URL,
            json={'fingerprint_id': fingerprint_id},
            timeout=5
        )

        print("Raspuns Django:", response.status_code)
        data = response.json()
        print(data)

        if response.status_code == 200:
            angajat = data.get("angajat", {})
            nume = angajat.get("nume", "Angajat")

            tip_actiune = data.get("tip_actiune", "")
            pontaj = data.get("pontaj", {})

            if tip_actiune == "checkin":
                ora = pontaj.get("ora_start", "")[:5]
                afiseaza_temporar(ser, nume, f"Intrare {ora}", stare_display)

            elif tip_actiune == "checkout":
                ora = pontaj.get("ora_sfarsit", "")[:5]
                afiseaza_temporar(ser, nume, f"Iesire {ora}", stare_display)

            else:
                afiseaza_temporar(ser, nume, data.get("mesaj", "Succes")[:16], stare_display)

        else:
            mesaj = data.get("mesaj", "Eroare")
            afiseaza_temporar(ser, "Eroare", mesaj[:16], stare_display)

    except Exception as e:
        print("Eroare la procesare scanare:", e)
        afiseaza_temporar(ser, "Eroare", "Scanare esuata", stare_display)


def proceseaza_enroll_activ(line, stare_enroll):
    cerere_id = stare_enroll.get("cerere_id")

    if line.startswith("ENROLL_STATUS:"):
        mesaj = line.replace("ENROLL_STATUS:", "").strip()
        print(f"Status enroll: {mesaj}")
        actualizeaza_enroll_status(cerere_id, "in_progress", mesaj)

    elif line.startswith("ENROLL_OK:"):
        mesaj = "Amprenta inregistrata"
        print(f"Enroll reusit pentru cererea {cerere_id}")
        actualizeaza_enroll_status(cerere_id, "success", mesaj)
        stare_enroll["activ"] = False
        stare_enroll["cerere_id"] = None
        stare_enroll["fingerprint_id"] = None

    elif line.startswith("ENROLL_FAIL:"):
        mesaj = line.replace("ENROLL_FAIL:", "").strip()
        print(f"Enroll esuat pentru cererea {cerere_id}: {mesaj}")
        actualizeaza_enroll_status(cerere_id, "failed", mesaj)
        stare_enroll["activ"] = False
        stare_enroll["cerere_id"] = None
        stare_enroll["fingerprint_id"] = None

    elif line.startswith("ENROLL_EXISTS:"):
        existing_id = line.replace("ENROLL_EXISTS:", "").strip()
        mesaj = f"Amprenta exista deja la ID {existing_id}"
        print(f"Enroll duplicat pentru cererea {cerere_id}: {mesaj}")
        actualizeaza_enroll_status(cerere_id, "failed", mesaj)
        stare_enroll["activ"] = False
        stare_enroll["cerere_id"] = None
        stare_enroll["fingerprint_id"] = None


def proceseaza_delete_activ(line, stare_delete):
    cerere_id = stare_delete.get("cerere_id")

    if line.startswith("DELETE_OK:"):
        mesaj = "Amprenta stearsa din senzor"
        print(f"Delete reusit pentru cererea {cerere_id}")
        actualizeaza_delete_status(cerere_id, "success", mesaj)
        stare_delete["activ"] = False
        stare_delete["cerere_id"] = None
        stare_delete["fingerprint_id"] = None

    elif line.startswith("DELETE_FAIL:"):
        mesaj = line.replace("DELETE_FAIL:", "").strip()
        print(f"Delete esuat pentru cererea {cerere_id}: {mesaj}")
        actualizeaza_delete_status(cerere_id, "failed", mesaj)
        stare_delete["activ"] = False
        stare_delete["cerere_id"] = None
        stare_delete["fingerprint_id"] = None


def main():
    ser = serial.Serial(SERIAL_PORT, BAUD_RATE, timeout=0.2)
    time.sleep(2)

    print(f'Conectat la {SERIAL_PORT}')

    stare_enroll = {
        "activ": False,
        "cerere_id": None,
        "fingerprint_id": None,
        "nume": None,
        "prenume": None,
    }

    stare_delete = {
        "activ": False,
        "cerere_id": None,
        "fingerprint_id": None,
    }

    stare_display = {
        "reset_la": 0,
        "activ": False
    }

    ultimul_poll_comenzi = 0
    interval_poll_comenzi = 2

    while True:
        try:
            acum = time.time()

            if stare_display["activ"] and acum >= stare_display["reset_la"]:
                stare_display["activ"] = False

            if (not stare_enroll["activ"] and not stare_delete["activ"]
                    and (acum - ultimul_poll_comenzi >= interval_poll_comenzi)):
                ultimul_poll_comenzi = acum

                data_enroll = verifica_cerere_enroll()
                if data_enroll.get("status") == "success":
                    cerere_id = data_enroll.get("cerere_id")
                    fingerprint_id = data_enroll.get("fingerprint_id")
                    angajat = data_enroll.get("angajat", {})

                    stare_enroll["activ"] = True
                    stare_enroll["cerere_id"] = cerere_id
                    stare_enroll["fingerprint_id"] = fingerprint_id
                    stare_enroll["nume"] = angajat.get("nume")
                    stare_enroll["prenume"] = angajat.get("prenume")

                    trimite_enroll(ser, fingerprint_id)
                    continue

                data_delete = verifica_cerere_delete()
                if data_delete.get("status") == "success":
                    cerere_id = data_delete.get("cerere_id")
                    fingerprint_id = data_delete.get("fingerprint_id")

                    stare_delete["activ"] = True
                    stare_delete["cerere_id"] = cerere_id
                    stare_delete["fingerprint_id"] = fingerprint_id

                    trimite_delete(ser, fingerprint_id)
                    continue

            line = ser.readline().decode('utf-8', errors='ignore').strip()

            if not line:
                continue

            print(f"Primit din Arduino: {line}")

            if stare_enroll["activ"] and (
                line.startswith("ENROLL_STATUS:")
                or line.startswith("ENROLL_OK:")
                or line.startswith("ENROLL_FAIL:")
                or line.startswith("ENROLL_EXISTS:")
            ):
                proceseaza_enroll_activ(line, stare_enroll)
                continue

            if stare_delete["activ"] and (
                line.startswith("DELETE_OK:")
                or line.startswith("DELETE_FAIL:")
            ):
                proceseaza_delete_activ(line, stare_delete)
                continue

            if line.startswith("ID:"):
                proceseaza_scanare(line, ser, stare_display)

            elif line == "UNKNOWN":
                print("Amprenta necunoscuta")
                afiseaza_temporar(ser, "Amprenta", "neidentificata", stare_display, durata=2)

            elif line == "Senzor OK":
                print("Senzor initializat corect")

        except Exception as e:
            print("Eroare:", e)
            time.sleep(1)


if __name__ == '__main__':
    main()