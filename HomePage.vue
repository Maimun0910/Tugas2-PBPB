<template>
  <ion-page>
    <ion-header :translucent="true">
      <ion-toolbar color="primary">
        <ion-title>Prakiraan Cuaca Jakarta</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content :fullscreen="true" class="ion-padding">
      <ion-header collapse="condense">
        <ion-toolbar>
          <ion-title size="large">Prakiraan Cuaca Jakarta</ion-title>
        </ion-toolbar>
      </ion-header>

      <!-- Status Loading -->
      <div v-if="loading" class="ion-text-center ion-padding my-5">
        <ion-spinner name="crescent" color="primary"></ion-spinner>
        <p>Mengambil data cuaca...</p>
      </div>

      <!-- Status Error -->
      <ion-card v-else-if="errorMessage" color="danger">
        <ion-card-header>
          <ion-card-title>Gagal Memuat Data</ion-card-title>
        </ion-card-header>
        <ion-card-content>
          {{ errorMessage }}
        </ion-card-content>
      </ion-card>

      <!-- Konten Utama (Cuaca Saat Ini & Liste Per Jam) -->
      <div v-else>
        <!-- Card Cuaca Saat Ini -->
        <ion-card color="light" class="current-weather-card">
          <ion-card-header>
            <ion-card-subtitle>KONDISI SAAT INI</ion-card-subtitle>
            <ion-card-title>{{ currentDate }}</ion-card-title>
          </ion-card-header>
          <ion-card-content>
            <div class="current-temp-container">
              <span class="current-temp">{{ currentTemperature }}°C</span>
              <span class="current-time">Pukul {{ currentTime }} WIB</span>
            </div>
          </ion-card-content>
        </ion-card>

        <!-- Daftar Data Cuaca per Jam -->
        <ion-list :inset="true">
          <ion-list-header>
            <ion-label>Prakiraan Suhu per Jam (°C)</ion-label>
          </ion-list-header>

          <ion-item v-for="(time, index) in weatherData.times" :key="index">
            <ion-icon :icon="timeOutline" slot="start" color="medium"></ion-icon>
            <ion-label>
              <h2>{{ formatDateTime(time) }}</h2>
              <p>Waktu lokal: {{ time }}</p>
            </ion-label>
            <ion-badge slot="end" :color="getBadgeColor(weatherData.temperatures[index])">
              {{ weatherData.temperatures[index] }} °C
            </ion-badge>
          </ion-item>
        </ion-list>
      </div>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonList,
  IonListHeader,
  IonItem,
  IonLabel,
  IonBadge,
  IonSpinner,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardSubtitle,
  IonCardContent,
  IonIcon
} from '@ionic/vue';
import { timeOutline } from 'ionicons/icons';

interface WeatherState {
  times: string[];
  temperatures: number[];
}

// Reactive States
const weatherData = ref<WeatherState>({ times: [], temperatures: [] });
const loading = ref<boolean>(true);
const errorMessage = ref<string>('');

// State untuk Tanggal, Waktu, dan Suhu Saat Ini
const currentDate = ref<string>('');
const currentTime = ref<string>('');
const currentTemperature = ref<number | string>('-');

const API_URL = 'https://api.open-meteo.com/v1/forecast?latitude=-6.2&longitude=106.8&hourly=temperature_2m';

// Fungsi Mendapatkan Tanggal & Waktu Lokal Saat Ini
const updateCurrentDateTime = () => {
  const now = new Date();
  
  // Format Tanggal (Contoh: "Sabtu, 31 Oktober 2026")
  currentDate.value = now.toLocaleDateString('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });

  // Format Jam Saat Ini (Contoh: "15:30")
  currentTime.value = now.toLocaleTimeString('id-ID', {
    hour: '2-digit',
    minute: '2-digit'
  });
};

// Fungsi Mengambil Data API
const fetchWeatherData = async () => {
  try {
    loading.value = true;
    errorMessage.value = '';
    
    const response = await fetch(API_URL);
    if (!response.ok) {
      throw new Error(`HTTP Error! Status: ${response.status}`);
    }
    
    const data = await response.json();
    weatherData.value = {
      times: data.hourly.time,
      temperatures: data.hourly.temperature_2m
    };

    // Cari suhu yang paling mendekati dengan jam saat ini
    setCurrentTemperature(data.hourly.time, data.hourly.temperature_2m);
  } catch (error) {
    console.error('Error fetching weather data:', error);
    errorMessage.value = 'Terjadi kesalahan saat mengambil data dari server.';
  } finally {
    loading.value = false;
  }
};

// Logika mencocokkan jam sekarang dengan array time dari API
const setCurrentTemperature = (times: string[], temperatures: number[]) => {
  const now = new Date();
  const currentHourString = now.toISOString().slice(0, 13); // format: "YYYY-MM-DDTHH"

  // Cari indeks yang memiliki jam yang sama
  const index = times.findIndex(t => t.startsWith(currentHourString));
  
  if (index !== -1) {
    currentTemperature.value = temperatures[index];
  } else {
    // Jika tidak ketemu jam yang persis sama, gunakan data pertama
    currentTemperature.value = temperatures[0] ?? '-';
  }
};

// Format tampilan tanggal per jam di daftar
const formatDateTime = (rawTime: string): string => {
  const date = new Date(rawTime);
  return date.toLocaleString('id-ID', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit'
  });
};

// Warna badge berdasarkan besarnya suhu
const getBadgeColor = (temp: number): string => {
  if (temp >= 32) return 'danger';
  if (temp >= 28) return 'warning';
  return 'primary';
};

onMounted(() => {
  updateCurrentDateTime();
  fetchWeatherData();
});
</script>

<style scoped>
.my-5 {
  margin-top: 3rem;
  margin-bottom: 3rem;
}

.current-weather-card {
  border-radius: 12px;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.08);
}

.current-temp-container {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  margin-top: 8px;
}

.current-temp {
  font-size: 2.8rem;
  font-weight: bold;
  color: var(--ion-color-primary);
}

.current-time {
  font-size: 1rem;
  color: var(--ion-color-medium);
}
</style>