<script setup>
import { ref, onMounted } from 'vue'

const API_BASE = 'http://localhost:1323'
const perPage = ref(3)
const currentPage = ref(1)
const products = ref([])
const totalPages = ref(1)
const loading = ref(false)
const error = ref(null)

async function loadProducts(page = 1) {
  loading.value = true
  error.value = null
  try {
    const res = await fetch(
      `${API_BASE}/api/products?page=${page}&per_page=${perPage.value}`,
      {
        method: 'GET',
        credentials: 'include'
      }
    )
    if (!res.ok) throw new Error(`Ошибка загрузки (${res.status})`)
    
    const data = await res.json()
    products.value = data.data || []
    totalPages.value = data.total_pages || 1
    currentPage.value = data.page || page
  } catch (err) {
    console.error(err)
    error.value = 'Не удалось загрузить список товаров'
  } finally {
    loading.value = false
  }
}

function goToPage(page) {
  if (page < 1 || page > totalPages.value) return
  currentPage.value = page
  loadProducts(page)
}

async function addToCart(product) {
  try {
    const res = await fetch(`${API_BASE}/api/cart`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: product.id, quantity: 1 })
    })
    if (!res.ok) throw new Error('Ошибка при добавлении в корзину')
    alert(`Товар "${product.name}" добавлен в корзину`)
  } catch (err) {
    console.error(err)
    alert('Не удалось добавить товар в корзину')
  }
}

onMounted(() => loadProducts(1))
</script>

<template>
  <main class="container my-5">
    <h1 class="mb-4 text-center">Наши услуги</h1>

    <div v-if="loading" class="text-center">Загрузка...</div>
    <div v-if="error" class="alert alert-danger text-center">{{ error }}</div>

    <div v-if="!loading && !error">
      <div class="text-center mb-5">
        <RouterLink to="/products-table" class="btn btn-primary">Список услуг (таблица)</RouterLink>
        <RouterLink to="/cart" class="btn btn-primary ms-2">Перейти в корзину</RouterLink>
      </div>

      <div 
        v-for="product in products"
        :key="product.id"
        class="card shadow rounded my-3"
      >
        <div class="card-body">
          <div class="row">
            <div class="col-md-2">
              <img
                :src="product.image"
                class="product-image"
                :alt="product.name"
              />
            </div>
            <div class="col-md-10 d-flex flex-column">
              <div class="product-name">{{ product.name }}</div>
              <div class="product-description">{{ product.description }}</div>
              <div class="flex-grow-1"></div>
              <div class="d-flex justify-content-end align-items-center">
                <div class="product-price me-3">
                  Ставка/доходность: {{ product.price }}
                </div>
                <button
                  class="btn btn-warning"
                  @click="addToCart(product)"
                >
                  <i class="bi bi-cart"></i> Оформить
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <nav v-if="totalPages > 1" aria-label="Page navigation" class="mt-4">
        <ul class="pagination justify-content-center">
          <li class="page-item" :class="{ disabled: currentPage === 1 }">
            <button
              class="page-link"
              @click="goToPage(currentPage - 1)"
            >
              Назад
            </button>
          </li>

          <li
            class="page-item"
            v-for="page in totalPages"
            :key="page"
            :class="{ active: currentPage === page }"
          >
            <button class="page-link" @click="goToPage(page)">
              {{ page }}
            </button>
          </li>

          <li
            class="page-item"
            :class="{ disabled: currentPage === totalPages }"
          >
            <button
              class="page-link"
              @click="goToPage(currentPage + 1)"
            >
              Вперёд
            </button>
          </li>
        </ul>
      </nav>
    </div>
  </main>
</template>

<style scoped>
.product-image {
  width: 100%;
  max-width: 120px;
  object-fit: cover;
}

.product-name {
  font-weight: bold;
  font-size: 1.1rem;
}

.product-description {
  font-size: 0.95rem;
  margin-bottom: 10px;
}
</style>
