<script setup>
import { ref, onMounted } from 'vue'

const API_BASE = 'http://localhost:1323'
const cart = ref([])
const loading = ref(false)
const error = ref(null)

async function loadCart() {
    loading.value = true
    error.value = null
    try {
        const res = await fetch(`${API_BASE}/api/cart`, {
            method: 'GET',
            credentials: 'include'
        })
        if (!res.ok) throw new Error(`Ошибка ${res.status}`)
        cart.value = await res.json() || []
    } catch (err) {
        console.error(err)
        error.value = 'Не удалось загрузить корзину'
    } finally {
        loading.value = false
    }
}

async function removeItem(id) {
    try {
        const res = await fetch(`${API_BASE}/api/cart/${id}`, {
            method: 'DELETE',
            credentials: 'include'
        })
        if (!res.ok) throw new Error('Ошибка удаления')
        cart.value = await res.json()
    } catch (err) {
        console.error(err)
        alert('Ошибка при удалении')
    }
}

async function updateQuantity(id, quantity) {
    try {
        const res = await fetch(`${API_BASE}/api/cart`, {
            method: 'PUT',
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id, quantity })
        })
        if (!res.ok) throw new Error('Ошибка обновления')
        cart.value = await res.json()
    } catch (err) {
        console.error(err)
        alert('Ошибка обновления количества')
    }
}

function increaseQuantity(id) {
    const item = cart.value.find(i => i.id === id)
    if (item) updateQuantity(id, item.quantity + 1)
}

function decreaseQuantity(id) {
    const item = cart.value.find(i => i.id === id)
    if (!item) return
    if (item.quantity > 1) updateQuantity(id, item.quantity - 1)
    else removeItem(id)
}

onMounted(loadCart)
</script>

<template>
    <main class="container my-5">
        <h1 class="mb-4 text-center">Корзина</h1>

        <div class="mb-3 text-end">
            <RouterLink to="/products-table" class="btn btn-primary">Вернуться к услугам</RouterLink>
        </div>

        <div v-if="error" class="alert alert-danger">{{ error }}</div>
        <div v-if="loading" class="text-center">Загрузка...</div>

        <div v-else>
            <div v-if="!cart.length" class="text-center">
                <p>Корзина пуста</p>
            </div>

            <div v-else>
                <table class="table table-striped align-middle">
                    <thead>
                        <tr>
                            <th>Фото</th>
                            <th>Название</th>
                            <th>Ставка/доходность</th>
                            <th>Количество</th>
                            <th>Действия</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr v-for="item in cart" :key="item.id">
                            <td><img :src="item.image" width="60" /></td>
                            <td>{{ item.name }}</td>
                            <td>{{ item.price }}</td>
                            <td>{{ item.quantity }}</td>
                            <td>
                                <button class="btn btn-sm btn-success me-2"
                                    @click="increaseQuantity(item.id)">+</button>
                                <button class="btn btn-sm btn-warning me-2"
                                    @click="decreaseQuantity(item.id)">−</button>
                                <button class="btn btn-sm btn-danger" @click="removeItem(item.id)">Удалить</button>
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>
    </main>
</template>
