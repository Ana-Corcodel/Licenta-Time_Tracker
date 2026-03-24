import serial
import requests
import time

SERIAL_PORT = 'COM6'
BAUD_RATE = 9600
DJANGO_URL = 'http://127.0.0.1:8000/api/scan-fingerprint/'

def trimite_display(ser, linia1, linia2):
    mesaj = f"DISPLAY:{linia1}|{linia2}\n"
    ser.write(mesaj.encode('utf-8'))
    print("Trimis la Arduino:", mesaj.strip())

def main():
    ser = serial.Serial(SERIAL_PORT, BAUD_RATE, timeout=1)
    time.sleep(2)

    print(f'Conectat la {SERIAL_PORT}')

    while True:
        try:
            line = ser.readline().decode('utf-8').strip()

            if not line:
                continue

            print(f"Primit din Arduino: {line}")

            if line.startswith("ID:"):
                fingerprint_id = int(line.split(":")[1])

                response = requests.post(
                    DJANGO_URL,
                    json={'fingerprint_id': fingerprint_id}
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
                        trimite_display(ser, nume, data.get("mesaj", "Succes"))

                else:
                    mesaj = data.get("mesaj", "Eroare")
                    trimite_display(ser, "Eroare", mesaj[:16])

            elif line == "UNKNOWN":
                print("Amprenta necunoscuta")
                trimite_display(ser, "Necunoscut", "Acces respins")

        except Exception as e:
            print("Eroare:", e)
            time.sleep(1)

if __name__ == '__main__':
    main()