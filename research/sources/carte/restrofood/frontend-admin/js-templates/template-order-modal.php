<script type="text/html" id="tmpl-rb_order_modal" >
	<div class="rb__wrapper orderadmin_popup_modal" id="orderadmin_popup_modal">
		<div class="rb_popup_modal open">
			<div class="rb_modal_wrap">
				<div class="rb_modal">
					<div class="rb_modal_inner">
						<!-- Close Modal -->
						<span class="rb_close_modal">
							<img src="<?php echo RESTROFOOD_DIR_URL.'assets/img/icon/close.svg'; ?>" alt="<?php echo esc_attr( 'close', 'restrofood' ); ?>" />
						</span>
						<!-- End Close Modal -->
						<div class="rb_modal_content">
							<div class="rb_modal_title rb_text_center">
								<h3><?php esc_html_e( 'Order Details', 'restrofood' ); ?></h3>
								<div class="print-btn-area">
									<span class="rb_btn_fill fb-inv-back fb-front-modal-inv-back"><?php esc_html_e( 'Back', 'restrofood' ); ?></span>
									<span class="rb_btn_fill fb-inv-print fb-front-modal-inv-print"><?php esc_html_e( 'Print Invoice', 'restrofood' ); ?></span>
								</div>
							</div>
							<?php
							$invoiceType = restrofood_getOptionData( 'invoice_type' );
							// Invoice Template												
							$Components = new \RestroFood\Components();
							if( $invoiceType != 'thermal' ) {
								$Components->invoice_js_template();
							} else {
								$Components->thermal_printer_invoice_template();
							}
							?>
							<div class="rb_modal_content_inner content-inner-hide">
								<div class="modal-order-top-info">
									<h4 class="order-id"><?php esc_html_e( 'Order ID: #', 'restrofood' ); ?>{{data.order_id}} </h4>
									<h4 class="order-id"><?php echo sprintf( esc_html__( 'Order Date: %s', 'restrofood' ), "{{data.created_date}}"  ); ?></h4>
									<# if( data.delivery_type ) { #>
									<h4 class="order-id"><?php echo sprintf( esc_html__( 'Delivery Type: %s', 'restrofood' ), "{{data.delivery_type}}"  ); ?></h4>
									<# } 
									if(data.inrestaurant_table_number) { 
									#>
									<h4 class="order-id"><?php echo sprintf( esc_html__( 'Table Number: %s', 'restrofood' ), "{{data.inrestaurant_table_number}}"  ); ?></h4>
									<# }
									if( data.delivery_date || data.pickup_time ) {
									var dDate = data.delivery_date ? data.delivery_date : '';
									var dTime = data.pickup_time ? data.pickup_time : '';
									#>
									<h4 class="order-id"><?php echo sprintf( esc_html__( 'Delivery/Pickup Date and Time: %s', 'restrofood' ), "{{ dDate +' / '+ dTime}}"  ); ?></h4>
									<# }#>
									<h4 class="order-id"><?php echo sprintf( esc_html__( 'Payment Method: %s', 'restrofood' ), "{{data.payment_method}}"  ); ?></h4>
								</div>
								<div class="fb-address-wrapper">
								    <div class="row">
										<div class="col-md-6">
											<div class="fb-billing-address">

												<h4><?php esc_html_e( 'Billing Information', 'restrofood' ); ?></h4>
												<# if( data.order_address.billing_name ){ #>
												<?php echo '<p>'.sprintf( esc_html__( 'Name: %s', 'restrofood' ), "{{data.order_address.billing_name}}" ).'</p>'; ?>
												<# } if( data.order_address.billing_name ){ #>
												<?php echo '<p>'.sprintf(  esc_html__( 'Phone: ', 'restrofood' ).'<a href="tel:%1$s">%1$s</a>', "{{data.order_address.billing_phone}}" ).'</p>'; ?>
												<# } #>
												<?php echo '<p>'.esc_html__( 'Address: ', 'restrofood' ).'{{data.order_address.billing_address}}</p>'; ?>
											</div>
										</div>

								    	<# if( data.order_address.shipping_address ) { #>
										<div class="col-md-6">
											<div class="fb-shipping-address">
												<h4><?php esc_html_e( 'Shipping Information', 'restrofood' ); ?></h4>
												<?php
												echo '<p>'.sprintf( esc_html__( 'Name: %s', 'restrofood' ), "{{data.order_address.shipping_name}}" ).'</p>';
								          		echo '<p>'.esc_html__( 'Address: ', 'restrofood' ).'{{data.order_address.shipping_address}}</p>';
								        
												?>
											</div>
										</div>
								    	<#}#>
								    </div>
								    <?php 
								    if( !empty( restrofood_getOptionData('delivery-directions-map') ) ):
								    ?>
								    <# if( !data.status_button.is_kitchen_manager && !data.status_button.is_branch_manager  ){ #>
								    <div class="row">
								    	<div class="rb_col_12">
								    		<div class="fb-shipping-address">
								    			<# var address =  data.order_address.shipping_address_1 ? data.order_address.shipping_address_1 : data.order_address.billing_address_1;
								    			var branchAddress = data.shop_address;
								    			#>
								    			<iframe src="https://www.google.com/maps/embed/v1/directions?origin={{branchAddress}}&destination={{address}}&key=<?php echo restrofood_getOptionData('google-api-key'); ?>&mode=<?php echo esc_attr( restrofood_getOptionData('delivery-transport-mode', 'driving') ); ?>" width="100%" height="350" allowfullscreen></iframe>
								    		</div>
								    	</div>
								    </div>
								    <#}#>
								    <?php
									endif;
								    ?>
								</div>
								<#
								if( data.status_button.order_status != 'OF' ){
								#>
								<div class="kitchen-change-tracking">
									<?php 
									$statusText = restrofood_getStatusText();
									?>
									<h4 class="rb_text_center"><?php esc_html_e( 'Tracking Status Action', 'restrofood' ); ?></h4>
									<div class="status-button-area">
										<!-- Don't show if user  delivery boy -->
										<# var getStatusData = data.status_button;  if( getStatusData.is_not_delivery_boy ) { #>
										<span data-orderid="{{data.order_id}}" data-tracking-status="OC" class="order-cancel {{getStatusData.status_class.oc}}"><?php echo esc_html( $statusText['oc'] ); ?></span>
										<!-- Don't show if user not branch manager -->
										<# if( getStatusData.is_branch_manager ){ #>
										<span data-orderid="{{data.order_id}}" data-tracking-status="STC"  class="status-btn send-to-cooking {{getStatusData.status_class.stc}}"><?php echo esc_html( $statusText['stc'] ); ?></span>
										<#
										}
										<!-- Don't show if user not kitchen manager -->
										if( getStatusData.is_kitchen_manager ){
										#>
										<span data-orderid="{{data.order_id}}" data-tracking-status="AC" class="cooking-accept status-btn {{getStatusData.status_class.ac}}"><?php echo esc_html( $statusText['ac'] ); ?></span>
										<# } #>
										<span data-orderid="{{data.order_id}}" data-tracking-status="CC" class="cooking-complete status-btn {{getStatusData.status_class.cc}}"><?php echo esc_html( $statusText['cc'] ); ?></span>
										<!--  end check Delivery boy user -->
										<# }#>
										<span data-orderid="{{data.order_id}}" data-tracking-status="OWD" class="status-btn {{getStatusData.status_class.owd}}"><?php echo esc_html( $statusText['otw'] ); ?></span>
										<span data-orderid="{{data.order_id}}" data-tracking-status="DC" class="cooking-accept status-btn {{getStatusData.status_class.dc}}"><?php echo esc_html( $statusText['dc'] ); ?></span>

									</div>
									<# if( getStatusData.is_not_delivery_boy ) { #>
									<div class="rb_row">
										<div class="rb_col_lg_6">
											<div class="delivery-boy rb_input_wrapper">
										        
										        <select class="rb_input_style" id="delivery_boy" name="delivery_boy">
										        	<#
										        	_.each( data.delivery_boies.boies, function( item, i ) {

										        	selected = ( i == data.delivery_boies.asigned_boy ) ? 'selected' : '';
										        	#>
										        	<option value="{{i}}" {{selected}} >{{item}}</option>
										        	<#}  )#>
										          
										        </select>
										        <button class="rb_btn_fill" id="delivery_assign" data-orderid="{{data.order_id}}" > <?php esc_html_e( 'Assign', 'restrofood' ); ?> </button>
										    </div>
										</div>

										<div class="rb_col_lg_6">
											<# if(data.is_multi_branch) { #>
											<div class="order-transfer rb_input_wrapper">
										        <select class="rb_input_style" id="branch_list" name="branch_id">
										          <option value=""><?php esc_html_e( 'Select Branch', 'restrofood' ); ?></option>
										          	<#
										        	_.each( data.branch_list.branches, function( item, i ) {

										        	selected = ( i == data.branch_list.asigned_branch ) ? 'selected' : '';
										        	#>
										        	<option value="{{i}}" {{selected}} >{{item}}</option>
										        	<#}  )#>
										        </select>
										        <button class="rb_btn_fill" id="order_transfer" data-orderid="{{data.order_id}}" > <?php esc_html_e( 'Transfer', 'restrofood' ); ?> </button>
										    </div>
										    <#}#>
										</div>
									</div>
									<#}#>
								</div>
								<#
								} <!-- OF Status Check End -->
								#>

								<div class="rb_order_table">       
									<table>
										<thead>
											<tr>
											<th><?php esc_html_e( 'Item Name', 'restrofood' ); ?></th>
											<th><?php esc_html_e( 'Quantity', 'restrofood' ); ?></th>
											<th><?php esc_html_e( 'Extra Item', 'restrofood' ); ?></th>
											<th><?php esc_html_e( 'Item Total Price', 'restrofood' ); ?></th>
											</tr>
										</thead>
										<tbody>
										<# _.each( data.order_items, function( item ) { #>
											<tr>
												<td>{{item.item_name}}</td>
												<td>{{item.item_qty}}</td>
												<td>{{{item.item_meta_data}}}</td>
												<td>{{{item.item_total_price}}}</td>
											</tr>
											<# } ) #>
											<tr>
												<td><?php esc_html_e( 'Order Notes:', 'restrofood' ); ?></td>
												<td>{{data.customer_note}}</td>
												<td></td>
												<td></td>
											</tr>
										</tbody>
										<tfoot>
											<# if( data.item_total ) { #>
											<tr>
												<th rowspan="1" colspan="1"></th>
												<th rowspan="1" colspan="1"></th>
												<th rowspan="1" colspan="1"><?php esc_html_e( 'Items Subtotal', 'restrofood' ); ?></th>
												<th rowspan="1" colspan="1">{{{data.item_total}}}</th>
											</tr>
											<# } #>
												
											<# if( data.discount_display ) { #>
											<tr>
												<th rowspan="1" colspan="1"></th>
												<th rowspan="1" colspan="1"></th>
												<th rowspan="1" colspan="1"><?php esc_html_e( 'Coupon(s):', 'restrofood' ); ?>  {{{data.used_coupons}}}</th>
												<th rowspan="1" colspan="1">- {{{data.discount_display}}}</th>
											</tr>
											<# } #>
											<# if( data.order_total_fees ) {
									        	_.each( data.get_fees, function( item ) {
									         #>
											<tr>
												<th rowspan="1" colspan="1"></th>
												<th rowspan="1" colspan="1"></th>
												<th rowspan="1" colspan="1">{{{item.name}}}</th>
												<th rowspan="1" colspan="1">{{{item.amount}}}</th>
											</tr>
											<# })} #>

											<# 
											if( data.get_tax_totals ){
											_.each( data.get_tax_totals , function( item ) {
											#>
											<tr>
												<th rowspan="1" colspan="1"></th>
												<th rowspan="1" colspan="1"></th>
												<th rowspan="1" colspan="1">{{{item.label}}}</th>
												<th rowspan="1" colspan="1">{{{item.formatted_amount}}}</th>
											</tr>
											<#})}#>

											<# if( data.order_shipping_total ) { #>
											<tr>
												<th rowspan="1" colspan="1"></th>
												<th rowspan="1" colspan="1"></th>
												<th rowspan="1" colspan="1"><?php esc_html_e( 'Shipping Fee', 'restrofood' ); ?></th>
												<th rowspan="1" colspan="1">{{{data.order_shipping_total}}}</th>
											</tr>
											<# } #>
											<tr>
												<th rowspan="1" colspan="1"></th>
												<th rowspan="1" colspan="1"></th>
												<th rowspan="1" colspan="1"><?php esc_html_e( 'Total', 'restrofood' ); ?></th>
												<th rowspan="1" colspan="1">{{{data.order_total}}}</th>
											</tr>
										</tfoot>
									</table>
								</div>
							</div>
						</div>
					</div>
				</div>
				
			</div>

		</div>
	</div>
</script>