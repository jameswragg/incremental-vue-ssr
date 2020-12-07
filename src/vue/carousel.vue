<template>
  <div>
    CAROUSEL
    <ul>
      <li v-for="(item, index) in internal_items" :key="index">{{ item.name }}</li>
    </ul>
    <button v-if="mounted" @click="loadMore">More</button>
  </div>
</template>

<script>
export default {
  props: {
    items: {
      type: Object,
      default: [],
    },
  },
  data() {
    return {
      internal_items: this.items,
      mounted: false,
    };
  },
  mounted() {
    this.mounted = true;
  },
  methods: {
    shuffle(array) {
      return array.sort(() => Math.random() - 0.5);
    },
    loadMore() {
      this.internal_items = this.shuffle(this.internal_items);
    },
  },
};
</script>

<style lang="scss" scoped>
div {
  margin: 10px 0;
  padding: 10px;
  background: lightgrey;
}
</style>
