<template>
  <div class="card p-3">
    <h4>Оцените приложение</h4>

    <div class="my-3">
      <div class="fs-3">
        <span v-for="n in 5" :key="n" class="me-2" style="cursor:pointer" @click="setRating(n)">
          <i :class="n <= rating ? 'bi-star-fill' : 'bi-star'"></i>
        </span>
      </div>
      <div class="mt-2">
        <button class="btn btn-sm btn-primary me-2" @click="submitRating">Отправить оценку</button>
        <button class="btn btn-sm btn-outline-secondary" @click="clearRating">Сброс</button>
      </div>
    </div>

    <div v-if="ratingMessage" class="alert alert-info mt-3">
      {{ ratingMessage }}
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'

const rating = ref(0)
const ratingMessage = ref('')

function setRating(n) {
  rating.value = n
}

function submitRating() {
  if (!rating.value) {
    ratingMessage.value = 'Пожалуйста, выберите количество звёзд.'
    return
  }
  ratingMessage.value = `Спасибо! Вы поставили ${rating.value} ${pluralizeStars(rating.value)}.`
}

function clearRating() {
  rating.value = 0
  ratingMessage.value = ''
}

function pluralizeStars(n) {
  if (n % 10 === 1 && n % 100 !== 11) return 'звезду'
  if (n % 10 >= 2 && n % 10 <= 4 && (n % 100 < 10 || n % 100 >= 20)) return 'звезды'
  return 'звёзд'
}
</script>

<style scoped>
i {
  font-size: 1.8rem;
  color: #f2c10f;
}
</style>
