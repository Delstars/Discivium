"""Render editable Markdown report and PlantUML SVGs into two PDFs."""
from pathlib import Path
import subprocess
import markdown
from weasyprint import HTML
root=Path(__file__).resolve().parent
uml=root/'uml'
out=root/'output'
out.mkdir(exist_ok=True)
sources=sorted(uml.glob('*.puml'))
subprocess.run(['plantuml','-tsvg',*[str(p) for p in sources]],check=True)
order=['use-cases','activity-submit','ssd-publish','ssd-submit','ssd-grade','submission-state','domain-model','class-model','components','deployment','internal-sequence','pattern-facade','pattern-strategy','pattern-adapter','pattern-observer','campus-use-cases','campus-domain','campus-components','campus-class','campus-deployment','activity-register','ssd-register','service-request-state','consent-state','invoice-poll-states']
css="""<style>@page {size:A4;margin:18mm;@bottom-right{content:counter(page)}} @page diagram {size:A4 landscape;margin:12mm} body{font-family:sans-serif;font-size:10pt;line-height:1.4;color:#18243a} h1{font-size:26pt} h2{font-size:17pt;color:#245c91;break-after:avoid} h3{font-size:12pt;break-after:avoid} table{border-collapse:collapse;width:100%;font-size:9pt;margin:12px 0} th,td{border:1px solid #c5cfdd;padding:5px;vertical-align:top} th{background:#e4edf9} tr{break-inside:avoid} .diagram{page:diagram;break-before:page;text-align:center} .diagram img{max-width:100%;max-height:153mm;object-fit:contain} a{overflow-wrap:anywhere}</style>"""
diagrams=''.join(f'<section class="diagram"><h2>{i+1}. {name.replace("-"," ").title()}</h2><img src="{(uml/(name+".svg")).as_uri()}"></section>' for i,name in enumerate(order))
report=markdown.markdown((root/'REPORT.md').read_text(),extensions=['tables','fenced_code'])
for name,body in [('Discivium_Report_DRAFT',report+diagrams),('Discivium_UML',diagrams)]:
    export_css=css
    if name=='Discivium_UML':
        export_css=css.replace('A4 landscape','A3 landscape').replace('max-height:153mm','max-height:245mm').replace('max-width:100%;','width:auto;max-width:100%;')
    HTML(string='<html><head>'+export_css+'</head><body>'+body+'</body></html>',base_url=str(root)).write_pdf(out/(name+'.pdf'))
