# Bibliografía — Agricultura multisensor (óptico + radar)

> Guardado localmente para trazabilidad científica. No sustituye lectura de los papers originales.

## Trigo / cereales / fenología S1+S2

| Autores | Año | Título | URL |
|---------|-----|--------|-----|
| Mandal et al. | 2020 | Dual polarimetric radar vegetation index for crop growth monitoring using Sentinel-1 SAR data | https://www.sciencedirect.com/science/article/abs/pii/S0034425720303242 |
| Mandal et al. (PDF) | 2020 | Versión accesible ESA STEP Forum | https://forum.step.esa.int/uploads/short-url/r4jFVNVhsM2vI1zb1Ufr7NBMDP4.pdf |
| Flores et al. | 2025 | The potential of Sentinel-1 time series for large-scale crop phenology monitoring | https://www.tandfonline.com/doi/full/10.1080/15481603.2025.2531593 |
| Meroni et al. | 2021 | Comparing land surface phenology of major European crops (SAR + multispectral S1/S2) | https://pmc.ncbi.nlm.nih.gov/articles/PMC7841528/ |
| Zhao et al. | 2023 | Combining multitemporal optical and SAR data for LAI imputation with BiLSTM | https://arxiv.org/abs/2307.07434 |
| Mouret et al. | 2020 | Outlier detection at parcel-level in wheat and rapeseed (multispectral + SAR) | https://arxiv.org/abs/2004.08431 |

## Café (referencia — implementación futura)

| Autores | Año | Título | URL |
|---------|-----|--------|-----|
| Maskell et al. | 2021 | Integration of Sentinel optical and radar for smallholder coffee systems (Vietnam) | https://www.sciencedirect.com/science/article/abs/pii/S0034425721004296 |
| Maskell et al. (PDF) | 2021 | PDF easel-lab | https://www.easel-lab-mondal.com/uploads/5/5/8/1/55819011/maskell_et_al._2021_-_rse.pdf |

## Cacao (referencia — implementación futura)

| Autores | Año | Título | URL |
|---------|-----|--------|-----|
| Abu et al. | 2021 | Detecting cocoa plantations in Côte d'Ivoire and Ghana | https://pubmed.ncbi.nlm.nih.gov/34602863/ |
| PANGAEA dataset | — | Cocoa Map Côte d'Ivoire and Ghana | https://doi.pangaea.de/10.1594/PANGAEA.917473 |
| Moraiti et al. | 2024 | Mapping Full-Sun Cocoa (Sentinel-2, limited reference) | https://www.mdpi.com/2072-4292/16/3/598 |
| Kalischek et al. | 2022 | Satellite-based high-resolution cocoa maps | https://arxiv.org/abs/2206.06119 |

## Soja / NDRE LAC (Doctor Soya — placeholders)

| Autores | Año | Título | URL |
|---------|-----|--------|-----|
| _(pendiente)_ | — | NDRE detección temprana roya soja LAC | _pegar enlace cuando lo tengas_ |
| _(pendiente)_ | — | DpRVI biomasa soja bajo nubes | Mandal 2020 (ver trigo) |

## Índices red-edge / NDRE (soja/maíz dosel denso)

| Fuente | URL |
|--------|-----|
| EOS — NDVI vs NDRE | https://eos.com/blog/ndvi-vs-ndre/ |

## Nota metodológica

Los índices ópticos clásicos (NDVI, EVI, NDRE, NDWI) son **necesarios pero insuficientes** en agroforestería (café/cacao). Para trigo y maíz en parcela homogénea, la fusión S1+S2 en **serie temporal** mejora fenología, biomasa y detección de anomalías vs un solo índice instantáneo.
