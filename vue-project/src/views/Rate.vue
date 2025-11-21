<template>
  <div class="card p-3">
    <h4>Оцените приложение</h4>

    <div class="my-3 text-center">
      <div class="fs-3">
        <span
          v-for="n in 5"
          :key="n"
          class="me-2"
          style="cursor:pointer"
          @click="setRating(n)"
        >
          <i :class="n <= rating ? 'bi-star-fill' : 'bi-star'"></i>
        </span>
      </div>

      <!-- Подпись под звёздами -->
      <div v-if="rating" class="mt-2 fs-5 text-secondary">
        {{ ratingLabel }}
      </div>

      <div class="mt-3">
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
import { ref, computed } from 'vue'

const rating = ref(0)
const ratingMessage = ref('')

// Словарь подписей
const labels = {
  1: 'Плохо',
  2: 'Удовлетворительно',
  3: 'Нормально',
  4: 'Хорошо',
  5: 'Отлично'
}

// Автоматически выбираем подпись по оценке
const ratingLabel = computed(() => labels[rating.value] || '')

function setRating(n) {
  rating.value = n
}

function submitRating() {
  if (!rating.value) {
    ratingMessage.value = 'Пожалуйста, выберите количество звёзд.'
    return
  }
  ratingMessage.value = `Спасибо! Ваша оценка: ${rating.value} ⭐ (${labels[rating.value]}).`
}

function clearRating() {
  rating.value = 0
  ratingMessage.value = ''
}
</script>

<style scoped>
i {
  font-size: 1.8rem;
  color: #a7b40f; /* как на вашей картинке */
}
</style>
