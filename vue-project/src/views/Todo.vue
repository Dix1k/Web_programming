<template>
  <div class="row">
    <div class="col-12 col-md-4 mb-3">
      <div class="card">
        <div class="card-header d-flex justify-content-between align-items-center">
          <strong>Заметки</strong>
          <button class="btn btn-sm btn-primary" @click="createNote">
            <i class="bi-plus-lg"></i> Новая
          </button>
        </div>
        <ul class="list-group list-group-flush" style="max-height:60vh; overflow:auto;">
          <li
            v-for="(note, index) in notes"
            :key="note.id"
            class="list-group-item d-flex justify-content-between align-items-center note-list-item"
            :class="{ active: currentIndex === index }"
            @click="selectNote(index)"
          >
            <div>
              <strong>{{ note.title }}</strong>
              <div class="text-muted small">{{ note.todos.length }} задач</div>
            </div>
            <div class="btn-group">
              <button class="btn btn-sm btn-outline-secondary" @click.stop="renameNote(index)">
                <i class="bi-pencil"></i>
              </button>
              <button class="btn btn-sm btn-outline-danger" @click.stop="confirmDelete(index)">
                <i class="bi-trash"></i>
              </button>
            </div>
          </li>

          <li v-if="notes.length === 0" class="list-group-item text-muted">
            Заметок нет. Создайте новую.
          </li>
        </ul>
      </div>

      <div class="mt-3 d-flex justify-content-between">
        <button class="btn btn-outline-secondary" @click="exportNotes">Экспорт</button>
        <button class="btn btn-outline-danger" @click="confirmClearAll" :disabled="notes.length===0">Очистить всё</button>
      </div>
    </div>

    <div class="col-12 col-md-8">
      <div v-if="currentNote" class="card">
        <div class="card-header d-flex justify-content-between align-items-center">
          <div>
            <input v-model="currentNote.title" class="form-control" />
            <div class="text-muted small mt-1">Редактирование названия заметки</div>
          </div>
          <div class="text-end">
            <button class="btn btn-sm btn-success" @click="saveNotes"><i class="bi-save"></i> Сохранить</button>
          </div>
        </div>

        <div class="card-body">
          <div class="mb-3">
            <label class="form-label">Добавить задачу</label>
            <div class="input-group">
              <input v-model="newTodoText" @keyup.enter="addTodo" type="text" class="form-control" placeholder="Текст задачи..." />
              <button class="btn btn-primary" @click="addTodo">Добавить</button>
            </div>
          </div>

          <ul class="list-group">
            <li v-for="(todo, tIndex) in currentNote.todos" :key="todo.id" class="list-group-item d-flex align-items-start">
              <div class="form-check me-3">
                <input class="form-check-input" type="checkbox" :id="'cb-'+todo.id" v-model="todo.done" @change="saveNotes" />
              </div>

              <div class="flex-grow-1">
                <input v-model="todo.text" @input="saveNotes" class="form-control todo-text" :class="{ 'done': todo.done }" />
                <div class="text-muted small">Задача {{ tIndex + 1 }}</div>
              </div>

              <div class="ms-2">
                <button class="btn btn-sm btn-outline-danger" @click="deleteTodo(tIndex)"><i class="bi-trash"></i></button>
              </div>
            </li>

            <li v-if="currentNote.todos.length === 0" class="list-group-item text-muted">
              Список задач пуст.
            </li>
          </ul>
        </div>
      </div>

      <div v-else class="card p-4 text-center text-muted">
        Выберите заметку или создайте новую.
      </div>
    </div>
  </div>
</template>

<script setup>
import { reactive, ref, computed, watch } from 'vue'
import Swal from 'sweetalert2'

const STORAGE_KEY = 'vue_todo_notes_v1'


function loadNotes() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) return JSON.parse(raw)
  } catch (e) {
    console.warn('Не удалось прочитать заметки из localStorage', e)
  }

  return [
    {
      id: Date.now(),
      title: 'Пример заметки',
      todos: [
        { id: 1, text: 'Первое задание', done: false },
        { id: 2, text: 'Второе задание', done: true }
      ]
    }
  ]
}

const notes = reactive(loadNotes())

const currentIndex = ref(notes.length ? 0 : -1)
const currentNote = computed(() => (currentIndex.value >= 0 ? notes[currentIndex.value] : null))

watch(
  () => notes,
  () => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(JSON.parse(JSON.stringify(notes))))
    } catch (e) {
      console.error(e)
    }
  },
  { deep: true }
)

function createNote() {
  const newNote = {
    id: Date.now() + Math.floor(Math.random() * 1000),
    title: 'Новая заметка',
    todos: []
  }
  notes.push(newNote)
  currentIndex.value = notes.length - 1
  saveNotes()
}

function selectNote(index) {
  currentIndex.value = index
}

function renameNote(index) {
  const note = notes[index]
  Swal.fire({
    title: 'Переименовать заметку',
    input: 'text',
    inputValue: note.title,
    showCancelButton: true
  }).then((res) => {
    if (res.isConfirmed && res.value !== undefined) {
      note.title = res.value || note.title
      saveNotes()
    }
  })
}

function confirmDelete(index) {
  const note = notes[index]
  Swal.fire({
    title: `Удалить заметку "${note.title}"?`,
    text: 'Это действие нельзя отменить.',
    icon: 'warning',
    showCancelButton: true,
    confirmButtonText: 'Удалить',
    cancelButtonText: 'Отмена'
  }).then((res) => {
    if (res.isConfirmed) {
      notes.splice(index, 1)
      if (notes.length === 0) {
        currentIndex.value = -1
      } else {
        currentIndex.value = Math.min(currentIndex.value, notes.length - 1)
      }
      saveNotes()
      Swal.fire('Удалено', '', 'success')
    }
  })
}

function confirmClearAll() {
  Swal.fire({
    title: 'Удалить все заметки?',
    text: 'Будут удалены все заметки и задачи.',
    icon: 'warning',
    showCancelButton: true,
    confirmButtonText: 'Удалить всё',
    cancelButtonText: 'Отмена'
  }).then((res) => {
    if (res.isConfirmed) {
      notes.splice(0, notes.length)
      currentIndex.value = -1
      saveNotes()
    }
  })
}

const newTodoText = ref('')

function addTodo() {
  if (!currentNote.value) return
  const text = (newTodoText.value || '').trim()
  if (!text) return
  currentNote.value.todos.push({
    id: Date.now() + Math.floor(Math.random() * 1000),
    text,
    done: false
  })
  newTodoText.value = ''
  saveNotes()
}

function deleteTodo(tIndex) {
  if (!currentNote.value) return
  currentNote.value.todos.splice(tIndex, 1)
  saveNotes()
}

function exportNotes() {
  const blob = new Blob([JSON.stringify(JSON.parse(JSON.stringify(notes)), null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'notes_export.json'
  a.click()
  URL.revokeObjectURL(url)
}
</script>

<style scoped>
.note-list-item {
  transition: background 0.12s;
}
</style>
