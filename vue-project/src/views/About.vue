<template>
  <div class="card">
    <div class="card-body">
      <h3>Об авторе</h3>
      <div class="row">
        <div class="col-12 col-md-4 text-center">
          <!-- Поставьте своё фото в public или assets и поменяйте путь -->
          <img :src="photoUrl" alt="Фото" class="img-fluid rounded mb-2" style="max-width:200px" />
        </div>
        <div class="col-12 col-md-8">
          <p><strong>ФИО:</strong> Ваше Имя</p>
          <p><strong>Группа/Курс:</strong> Укажите данные</p>
          <p><strong>Кратко о себе:</strong> Небольшое описание — навыки, интересы, что-то ещё.</p>
          <p>Эта страница оформлена как дополнительная часть практического задания.</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
const photoUrl = '/favicon.ico' // замените на /assets/yourphoto.png или путь в public
</script>

<style scoped>
</style>
