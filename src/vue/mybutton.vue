<template>
  <div @click="count++">Oh hai my Button {{ count }} {{ msg }}</div>
</template>

<script>
export default {
  props: {},
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
// styles
div {
  background: red;
  color: white;
  margin: 10px;
}
</style>
