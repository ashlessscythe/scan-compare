from ._anvil_designer import ReportPDFTemplate
from anvil import *
import anvil.server
import anvil.google.auth, anvil.google.drive
from anvil.google.drive import app_files
import anvil.users
import anvil.tables as tables
import anvil.tables.query as q
from anvil.tables import app_tables

class ReportPDF(ReportPDFTemplate):
  def __init__(self, **properties):
    # Set Form properties and Data Bindings.
    self.init_components(**properties)
    print(f"args is {properties}, pallets is {properties['pallets']} and sid is {properties['sid']}")
    self.label_pallets.text = properties['pallets']
    self.label_shipment.text = properties['sid']
    # self.label_1.text = arg1 # <- passed in via PDFRenderer(filename=f'{name}_report.pdf').render_form('ReportPDF', arg1)
    # Any code you write here will run before the form opens.
