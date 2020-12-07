<template>
  <button @click="count++">
    Count:{{ count }} <br />
    <strong v-if="msg">{{ msg }}</strong>
  </button>
</template>

<script>
export default {
  props: {
    propMsg: {
      type: String,
      default: '',
    },
  },
  data() {
    return {
      count: 0,
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
