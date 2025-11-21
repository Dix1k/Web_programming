<template>
  <div class="card">
    <div class="card-body">
      <h3>Об авторе</h3>
      <div class="row">
        <div class="col-12 col-md-4 text-center">
          <img :src="photoUrl" alt="Фото" class="img-fluid rounded mb-2" style="max-width:200px" />
        </div>
        <div class="col-12 col-md-8">
          <p><strong>ФИО:</strong> Власов Дмитрий Алексеевич</p>
          <p><strong>Группа/Курс:</strong> ПИНб-31</p>
          <p><strong>Кратко о себе:</strong> Обычный парень, который учится на программиста.</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
    import photoUrl from '@/assets/photo.jpg'
</script>

<style scoped>
</style>
