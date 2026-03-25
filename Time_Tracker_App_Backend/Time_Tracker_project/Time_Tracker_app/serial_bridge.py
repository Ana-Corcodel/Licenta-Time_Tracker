import serial
import requests
import time

SERIAL_PORT = 'COM6'
BAUD_RATE = 9600

DJANGO_BASE_URL = 'http://127.0.0.1:8000/api'
SCAN_URL = f'{DJANGO_BASE_URL}/scan-fingerprint/'
ENROLL_PENDING_URL = f'{DJANGO_BASE_URL}/enroll-pending/'


def trimite_display(ser, linia1, linia2):
    mesaj = f"DISPLAY:{linia1}|{linia2}\n"
    ser.write(mesaj.encode('utf-8'))
    print("Trimis la Arduino:", mesaj.strip())


def trimite_enroll(ser, fingerprint_id):
    mesaj = f"ENROLL:{fingerprint_id}\n"
    ser.write(mesaj.encode('utf-8'))
    print("Trimis la Arduino:", mesaj.strip())


def actualizeaza_enroll_status(cerere_id, status, mesaj):
    try:
        response = requests.post(
            f"{DJANGO_BASE_URL}/enroll-update/{cerere_id}/",
            json={
                "status": status,
                "mesaj": mesaj
            },
            timeout=5
        )
        print(f"Update enroll {cerere_id}: {response.status_code} {response.text}")
    except Exception as e:
        print(f"Eroare la update enroll status: {e}")


def verifica_cerere_enroll():
    try:
        response = requests.get(ENROLL_PENDING_URL, timeout=5)
        data = response.json()
        return data
    except Exception as e:
        print(f"Eroare la verificare enroll pending: {e}")
        return {"status": "empty"}


def proceseaza_scanare(line, ser):
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
                trimite_display(ser, nume, f"Intrare {ora}")

            elif tip_actiune == "checkout":
                ora = pontaj.get("ora_sfarsit", "")[:5]
                trimite_display(ser, nume, f"Iesire {ora}")

            else:
                trimite_display(ser, nume, data.get("mesaj", "Succes")[:16])

        else:
            mesaj = data.get("mesaj", "Eroare")
            trimite_display(ser, "Eroare", mesaj[:16])

    except Exception as e:
        print("Eroare la procesare scanare:", e)
        trimite_display(ser, "Eroare", "Scan esuat")


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

    elif line.startswith("ENROLL_FAIL:"):
        mesaj = line.replace("ENROLL_FAIL:", "").strip()
        print(f"Enroll esuat pentru cererea {cerere_id}: {mesaj}")
        actualizeaza_enroll_status(cerere_id, "failed", mesaj)
        stare_enroll["activ"] = False

    elif line.startswith("ENROLL_EXISTS:"):
        existing_id = line.replace("ENROLL_EXISTS:", "").strip()
        mesaj = f"Amprenta exista deja in senzor la ID {existing_id}"
        print(f"Enroll duplicat pentru cererea {cerere_id}: {mesaj}")
        actualizeaza_enroll_status(cerere_id, "failed", mesaj)
        stare_enroll["activ"] = False


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

    ultimul_poll_enroll = 0
    interval_poll_enroll = 2  # secunde

    while True:
        try:
            # 1. Daca nu avem enroll activ, verificam periodic daca exista cereri noi
            acum = time.time()
            if not stare_enroll["activ"] and (acum - ultimul_poll_enroll >= interval_poll_enroll):
                ultimul_poll_enroll = acum

                data = verifica_cerere_enroll()

                if data.get("status") == "success":
                    cerere_id = data.get("cerere_id")
                    fingerprint_id = data.get("fingerprint_id")
                    angajat = data.get("angajat", {})
                    nume = angajat.get("nume", "Angajat")
                    prenume = angajat.get("prenume", "")

                    stare_enroll["activ"] = True
                    stare_enroll["cerere_id"] = cerere_id
                    stare_enroll["fingerprint_id"] = fingerprint_id
                    stare_enroll["nume"] = nume
                    stare_enroll["prenume"] = prenume

                    trimite_enroll(ser, fingerprint_id)

            # 2. Citim orice vine de la Arduino
            line = ser.readline().decode('utf-8', errors='ignore').strip()

            if not line:
                continue

            print(f"Primit din Arduino: {line}")

            # 3. Daca avem enroll activ, prioritate pentru mesajele de enroll
            if stare_enroll["activ"] and (
                line.startswith("ENROLL_STATUS:")
                or line.startswith("ENROLL_OK:")
                or line.startswith("ENROLL_FAIL:")
                or line.startswith("ENROLL_EXISTS:")
            ):
                proceseaza_enroll_activ(line, stare_enroll)
                continue

            # 4. Scanare normala
            if line.startswith("ID:"):
                proceseaza_scanare(line, ser)

            elif line == "UNKNOWN":
                print("Amprenta necunoscuta")
                trimite_display(ser, "Necunoscut", "Acces respins")

            elif line == "Senzor OK":
                print("Senzor initializat corect")

        except Exception as e:
            print("Eroare:", e)
            time.sleep(1)


if __name__ == '__main__':
    main()