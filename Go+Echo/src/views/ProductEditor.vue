<script setup>
import { ref, onMounted, watch } from 'vue'

const STORAGE_KEY = 'products'
const products = ref([])
const newProduct = ref({ name: '', description: '', price: '', image: '' })

function loadProducts() {
    const stored = localStorage.getItem(STORAGE_KEY)
    products.value = stored ? JSON.parse(stored) : []
}

onMounted(loadProducts)
watch(products, (val) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(val))
}, { deep: true })

function addProduct() {
    if (!newProduct.value.name) return alert('Введите название')
    products.value.push({ ...newProduct.value, id: Date.now() })
    newProduct.value = { name: '', description: '', price: '', image: '' }
}

function editProduct(product) {
    const index = products.value.findIndex(p => p.id === product.id)
    if (index !== -1) products.value[index] = { ...product }
}

function deleteProduct(id) {
    products.value = products.value.filter(p => p.id !== id)
}
</script>

<template>
    <main class="container my-5">
        <h1>Редактор услуг</h1>

        <div class="mb-3 text-end">
            <RouterLink to="/products-table" class="btn btn-primary">Назад к услугам</RouterLink>
        </div>

        <div class="mb-4">
            <input v-model="newProduct.name" placeholder="Название" class="form-control mb-1" />
            <input v-model="newProduct.description" placeholder="Описание" class="form-control mb-1" />
            <input v-model="newProduct.price" placeholder="Ставка/доходность" class="form-control mb-1" />
            <input v-model="newProduct.image" placeholder="Ссылка на картинку" class="form-control mb-1" />
            <div v-if="newProduct.image" class="mb-1">
                <img :src="newProduct.image" :alt="newProduct.name" width="60" />
            </div>
            <button class="btn btn-success" @click="addProduct">Добавить услугу</button>
        </div>

        <table class="table table-hover">
            <thead>
                <tr>
                    <th>Фото</th>
                    <th>Название</th>
                    <th>Описание</th>
                    <th>Ставка/доходность</th>
                    <th>Действия</th>
                </tr>
            </thead>

            <tbody>
                <tr v-for="product in products" :key="product.id">
                    <td>
                        <input v-model="product.image" class="form-control" />
                        <img v-if="product.image" :src="product.image" :alt="product.name" width="60" class="mt-1" />
                    </td>
                    <td><input v-model="product.name" class="form-control" /></td>
                    <td><input v-model="product.description" class="form-control" /></td>
                    <td><input v-model="product.price" class="form-control" /></td>
                    <td>
                        <button class="btn btn-primary me-1" @click="editProduct(product)">Сохранить</button>
                        <button class="btn btn-danger" @click="deleteProduct(product.id)">Удалить</button>
                    </td>
                </tr>
            </tbody>
        </table>
    </main>
</template>
