<script setup>
import { ref, onMounted } from 'vue'

const API_BASE = 'http://localhost:1323'
const perPage = ref(4)
const currentPage = ref(1)
const productsPage = ref([])
const totalPages = ref(1)
const loading = ref(false)
const error = ref(null)

async function fetchProducts(page = 1) {
    loading.value = true
    error.value = null
    try {
        const res = await fetch(`${API_BASE}/api/products?page=${page}&per_page=${perPage.value}`, {
            method: 'GET',
            credentials: 'include'
        })
        if (!res.ok) throw new Error(`Ошибка ${res.status}`)
        const json = await res.json()
        productsPage.value = json.data || []
        totalPages.value = json.total_pages || 1
        currentPage.value = json.page || page
    } catch (err) {
        console.error(err)
        error.value = 'Не удалось загрузить товары'
    } finally {
        loading.value = false
    }
}

onMounted(() => fetchProducts(1))

function goToPage(page) {
    if (page < 1 || page > totalPages.value) return
    fetchProducts(page)
}

async function addToCart(product) {
    try {
        const res = await fetch(`${API_BASE}/api/cart`, {
            method: 'POST',
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: product.id, quantity: 1 })
        })
        if (!res.ok) throw new Error('Ошибка добавления в корзину')
        alert(`Товар "${product.name}" добавлен в корзину`)
    } catch (err) {
        console.error(err)
        alert('Ошибка при добавлении в корзину')
    }
}
</script>

<template>
    <main class="container my-5">
        <h1 class="mb-4">Список услуг</h1>

        <div class="mb-3 text-end">
            <RouterLink to="/products-editor" class="btn btn-primary me-2">Редактировать услуги</RouterLink>
            <RouterLink to="/cart" class="btn btn-primary">Корзина</RouterLink>
        </div>

        <div v-if="error" class="alert alert-danger">{{ error }}</div>
        <div v-if="loading" class="text-center">Загрузка...</div>

        <div v-else>
            <div class="table-responsive">
                <table class="table table-hover align-middle">
                    <thead>
                        <tr>
                            <th>Фото</th>
                            <th>Название</th>
                            <th>Описание</th>
                            <th>Ставка/доходность</th>
                            <th>Действие</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr v-for="product in productsPage" :key="product.id">
                            <td><img :src="product.image" :alt="product.name" width="60" /></td>
                            <td>{{ product.name }}</td>
                            <td>{{ product.description }}</td>
                            <td>{{ product.price }}</td>
                            <td>
                                <button class="btn btn-warning btn-sm" @click="addToCart(product)">
                                    <i class="bi bi-cart"></i> Добавить в корзину
                                </button>
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>

            <nav v-if="totalPages > 1" aria-label="Page navigation">
                <ul class="pagination justify-content-center">
                    <li class="page-item" :class="{ disabled: currentPage === 1 }">
                        <button class="page-link" @click="goToPage(currentPage - 1)">Назад</button>
                    </li>

                    <li class="page-item" v-for="p in totalPages" :key="p" :class="{ active: currentPage === p }">
                        <button class="page-link" @click="goToPage(p)">{{ p }}</button>
                    </li>

                    <li class="page-item" :class="{ disabled: currentPage === totalPages }">
                        <button class="page-link" @click="goToPage(currentPage + 1)">Вперед</button>
                    </li>
                </ul>
            </nav>
        </div>
    </main>
</template>

<style scoped>
.table td,
.table th {
    vertical-align: middle;
}
</style>
