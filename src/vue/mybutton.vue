<template>
  <button @click="internal_count++">
    Count:{{ internal_count }} <br />
    <strong v-if="msg">{{ msg }}</strong>
  </button>
</template>

<script>
export default {
  props: {
    count: {
      type: Number,
      default: 0,
    },
  },
  data() {
    return {
      internal_count: this.count,
      msg: '',
    };
  },
  mounted() {
    this.msg = 'mounted!';
  },
};
</script>

<style lang="scss" scoped>
button {
  padding: 10px;

  strong {
    display: inline-block;
    padding: 4px 8px;
    background: red;
    color: white;
  }
}
</style>
