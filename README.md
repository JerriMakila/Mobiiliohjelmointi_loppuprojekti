# Mobiiliohjelmointi_loppuprojekti

Lyhyt kuvaus sovelluksesta:
  Sovellusta on tarkoitus käyttää lastenhoitajan apuna. Huoltaja voi laittaa ns "aikataulun" lapsen päivärytmistä sovellukseen ja lisätä kuvia, joista
  ilmenee hoitamiseen tarkoitettujen tavaroiden sijainti. Hoitaja voi tarkastaa nämä ohjeet omasta sovelluksestaan.
  
Komponentit:
  React-native-navigaatio (Tab-navigaatio)
  React-native-elements käyttöliittymäkirjasto
  React Native Date-Time-Picker (@react-native-community/datetimepicker)
  Expo ImagePicker
  React-Native-Picker (@react-native-picker/picker)
  
 Tallennus:
  Tiedot tallennetaan Googlen firebase-palveluun, mistä se päivittyy oitis myös vastaanottajan sovellukseen.
  Tietojen tallentamiseen käytetään sekä Firebasen Realtime Databasea että Cloud Storagea.
  Tämän lisäksi Firebase varmentaa käyttäjän anonyymisti ja antaa kullekin käyttäjälle oman käyttäjä-id:n,
  jolloin voidaan esimerkiksi antaa kunkin "hoitopäivän" muokkaaminen vain sen tekijän vastuulle.
