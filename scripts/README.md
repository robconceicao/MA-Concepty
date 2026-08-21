# scripts

`build-brand-assets.py` gera o monograma MA e a assinatura MARCO Concept Beauty
em SVG a partir dos contornos da Playfair Display (OFL), e os PNGs saem dai com
`rsvg-convert`.

```bash
pip install fonttools
curl -o PlayfairDisplay-Regular.ttf \
  "https://fonts.gstatic.com/s/playfairdisplay/v40/nuFvD-vYSZviVYUb_rj3ij__anPXJzDwcbmjWBN2PKdFvUDQ.ttf"
python3 build-brand-assets.py           # escreve os .svg em ./out
rsvg-convert -w 1024 -h 1024 out/monogram-black.svg -o ../assets/icon.png
```

So e necessario se quisermos regerar os assets. Com os arquivos oficiais da
marca em maos, basta substituir os PNGs em `assets/`.
