# Spezifikation: Familien-Dashboard

## 1. Zweck
Ein Dashboard für die Familie. Es zeigt alles Wichtige für den Alltag auf einer Seite:
Termine, Notizen, Aufgaben, den Essensplan für die Woche und die Einkaufsliste.

## 2. Nutzer
- Mama und Papa.
- Die Bedienung soll einfach sein und ohne Anleitung funktionieren.
- Alle benutzen **ein gemeinsames Gerät** (zum Beispiel ein Tablet in der Küche).

## 3. Funktionen

### 3.1 Kalender
- Ansicht: **Monatsansicht** (Raster mit einem Kästchen pro Tag), Monate vor- und zurückblättern.
- Ereignis eintragen: Datum, Titel, Uhrzeit (freiwillig).
- Klick auf einen Tag zeigt alle Termine dieses Tages.
- Ereignisse werden **nicht** gelöscht und **nicht** abgehakt. Der Kalender läuft fortlaufend weiter.

### 3.2 Notizen („Daran müssen wir denken“)
- Notiz eintragen.
- Notiz abhaken: Sie ist **sofort weg**.
- Kurz nach dem Abhaken gibt es einen Knopf „Rückgängig“, falls man sich verklickt hat.

### 3.3 Aufgaben
- Aufgabe eintragen und **Mama, Papa oder Beiden** zuweisen.
- Aufgabe abhaken: Sie ist **sofort weg** (mit „Rückgängig“ wie bei den Notizen).

### 3.4 Wochenplan („Was kochen wir diese Woche?“)
- Für jeden Tag von Montag bis Sonntag ein Gericht eintragen (eine Mahlzeit pro Tag).
- Man kann zur nächsten und vorigen Woche blättern.

### 3.5 Einkaufsliste
- Artikel eintragen.
- Artikel abhaken: Er wird **durchgestrichen**, nicht gelöscht. Ein zweiter Klick nimmt den Haken wieder weg.
- Abgehakte Artikel werden **7 Tage nach dem Abhaken** automatisch gelöscht.

## 4. Daten
- Gespeichert wird im Browser des Geräts (localStorage). Es gibt keinen Server.
- Gespeichert werden: Kalender-Ereignisse, Notizen, Aufgaben, Wochenplan und Einkaufsliste.
- Bei abgehakten Artikeln der Einkaufsliste wird der Zeitpunkt des Abhakens gespeichert (für die 7-Tage-Regel).
- Grenze: Wer die Browserdaten löscht, löscht auch das Dashboard. Ein anderes Gerät sieht die Daten nicht.

## 5. Oberfläche
- Stil: Comic-Heft, wie ein amerikanisches Superhelden-Comic.
  - wirkt gezeichnet: dicke schwarze Umrisse, Comic-Panels, Sprechblasen, Rasterpunkte
  - helle, leichte Farben, keine grellen Farben
  - keine Original-Figuren, Logos oder Namen von Marvel, weil diese urheberrechtlich geschützt sind; nur der Zeichenstil
- Jeder Bereich ist ein eigenes Comic-Panel.
- Benutzerfreundlich: große Knöpfe, klare Beschriftung, Eintragen mit wenigen Klicks.
- Passt sich an die Bildschirmgröße an (PC, Tablet, Handy).

## 6. Technik und Grenzen
- Nur HTML, CSS und JavaScript.
- Keine externen Bibliotheken und keine externen Schriften.
- Keine Passwörter oder Schlüssel in den Dateien.
- Die Seite läuft im Browser, auch ohne Internet.

## 7. Abnahmekriterien
- [ ] Ich kann ein Kalender-Ereignis eintragen. Es erscheint im Monatsraster und kann nicht gelöscht werden.
- [ ] Ich kann im Kalender Monate vor- und zurückblättern.
- [ ] Ich kann eine Notiz eintragen. Nach dem Abhaken ist sie weg, und „Rückgängig“ holt sie zurück.
- [ ] Ich kann eine Aufgabe eintragen und Mama, Papa oder Beiden zuweisen. Nach dem Abhaken ist sie weg.
- [ ] Ich kann für jeden Tag der Woche ein Gericht eintragen.
- [ ] Ich kann einen Artikel auf die Einkaufsliste setzen. Nach dem Abhaken ist er durchgestrichen.
- [ ] Ein abgehakter Artikel verschwindet erst 7 Tage nach dem Abhaken.
- [ ] Nach dem Neuladen der Seite sind alle Einträge noch da.
- [ ] Die Seite sieht aus wie ein Comic-Heft, mit hellen Farben.
