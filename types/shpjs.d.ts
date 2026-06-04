declare module 'shpjs' {
  function shp(buffer: ArrayBuffer): Promise<unknown>;
  export default shp;
}
