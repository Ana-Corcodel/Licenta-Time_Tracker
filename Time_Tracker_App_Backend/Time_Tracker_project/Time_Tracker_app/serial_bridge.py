import serial
import requests
import time

SERIAL_PORT = 'COM6'
BAUD_RATE = 9600
DJANGO_URL = 'http://127.0.0.1:8000/api/scan-fingerprint/'

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

                print("Raspuns Django:", response.status_code, response.text)

            elif line == "UNKNOWN":
                print("Amprenta necunoscuta")

        except Exception as e:
            print("Eroare:", e)
            time.sleep(1)

if __name__ == '__main__':
    main()