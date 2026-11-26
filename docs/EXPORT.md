# Export and submission checklist

Use PlantUML (standard UML tool), Java and Graphviz. From repository root:
```sh
plantuml -tsvg docs/uml/*.puml
```
For a combined report with appendix and standalone readable UML PDF, install Python packages:
```sh
python -m pip install markdown weasyprint
python docs/export.py
```
WeasyPrint needs native system libraries on some operating systems; Linux or GitHub Actions is recommended. Generated PDFs go to docs/output. Review all pages and fill actual team information and verification results in REPORT.md before running. Diagrams are one landscape page each; check legibility. The report remains a draft until reviewed. Submit final report PDF, standalone UML PDF, source link and contribution signatures per brief.
