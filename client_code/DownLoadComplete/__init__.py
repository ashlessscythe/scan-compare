from ._anvil_designer import DownLoadCompleteTemplate
from anvil import *
import anvil.server
import anvil.google.auth, anvil.google.drive
from anvil.google.drive import app_files
import anvil.users
import anvil.tables as tables
import anvil.tables.query as q
from anvil.tables import app_tables

class DownLoadComplete(DownLoadCompleteTemplate):
  def __init__(self, args, **properties):
    # Set Form properties and Data Bindings.
    self.init_components(**properties)
    # doesn't print....
    # pass in args obj
    sid = args['sid']
    pallets = args['pallets']
    print(f"pallets is {pallets} and sid is {sid}")
    self.label_pallets.text = pallets
    self.label_shipment.text = sid
    # self.label_1.text = arg1 # <- passed in via PDFRenderer(filename=f'{name}_report.pdf').render_form('ReportPDF', arg1)
    # Any code you write here will run before the form opens.
    self.repeating_panel_1.items = anvil.server.call('get_shipment_rows', sid)

  def outlined_button_1_click(self, **event_args):
    """This method is called when the button is clicked"""
    # result = anvil.server.call("export_to_excel", globals.shipment)
    # anvil.media.download(result)
    r = anvil.server.call('get_shipment_row', globals.shipment)
    args = {'sid':r['shipment'], 'pallets':r['total_pallets']}
    print(f"button pressed: args is {args}")
    pdf = anvil.server.call('create_pdf', **args)
    print(f"pdf returned... attempting download")
    anvil.media.download(pdf)

