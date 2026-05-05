<?php
namespace RestroFood;

/**
 * Restrofood admin
 *
 * @package     Restrofood
 * @author      ThemeLooks
 * @copyright   2020 ThemeLooks
 * @license     GPL-2.0-or-later
 *
 *
 */

if( !class_exists( 'Admin_Sub_Menu_Templates' ) ) {

	class Admin_Sub_Menu_Templates {
		// Get current date using wp_date
		private static function getDisplayCurrentDate() {
			return restrofood_current_date( true );
		}
		private static function getCurrentDate() {
			return restrofood_current_date();
		}
		//
		public function kitchen_template( $date  = '' ) {

			$options = get_option('restrofood_options');

			if( !empty( $options['kitchen-all-order'] ) ) {
				$meta_value = '';
				$compare = '';
			} else {
				$meta_value = 'OP';
				$compare = '!=';
			}

			// Init Components class
			$Components = new Components();
		    // Get current date
		    $currentDate = self::getCurrentDate();
		    $displayCurrentDate = self::getDisplayCurrentDate();

		    // order query args
		    $orderArgs = array(
				'limit' 		=> '-1',
				'date_created'	=> !empty( $date ) ? esc_html( $date ) : esc_html( $currentDate ),
				'meta_key'      => '_order_tracking_status',
				'meta_value'    => $meta_value,
				'meta_compare' 	=> $compare,
		    );

		    //
			if( restrofood_is_multi_branch() ) {
				//
				$currentUser = get_current_user_id();
				// Get branch
				$args = array (
				  'post_type'        => 'branches',
				  'post_status'      => 'publish',
				  'meta_key'         => 'restrofoodkitchen_manager',
				  'meta_value'       => esc_html( $currentUser ),
				  'meta_compare' => 'LIKE'
				);

				$getBranches = get_posts( $args );
				$getBranchesId	 = array_column( $getBranches, 'ID' );
				$getBranchesId	 = !empty( $getBranchesId[0] ) ? $getBranchesId[0] : '';
				$getBranchesName = array_column( $getBranches, 'post_title' );
				$getBranchesName = !empty( $getBranchesName[0] ) ? $getBranchesName[0] : '';
				// Set branch id in order args
				$orderArgs['branch']	= esc_html( $getBranchesId ); // Branch id;
			}
		      
			$orders = wc_get_orders( $orderArgs );

			?>
			<div class="kitchen-order">
				<div class="rb_row">
					<div class="rb_col_12">
						<?php 
						$date = !empty( $date ) ? $date : $displayCurrentDate;
						if( restrofood_is_multi_branch() ):
						?>
						<h4 class="bf-order-title rb_text_center rb_mb_20"><?php echo sprintf( esc_html__( 'Welcome To %s Branch Kitchen' ), esc_html( $getBranchesName ) ); ?> </h4>
						<?php 
						endif;
						?>
						<h4 class="bf-order-title rb_text_center rb_mb_50"><?php esc_html_e( 'Order List :', 'restrofood' ); ?> <?php echo esc_html( $date ); ?></h4>
					</div>
				</div>
				<div class="rb_row">
					<div class="rb_col_12">
						<div class="fb-order-notification"></div>
					</div>
				</div>
			</div>
			<table class="wp-list-table widefat fixed responsive restrofood-order-data-table restrofood-order-list">
				<?php 
				// Table header 
				self::data_table_header();
				// Table body
				self::data_table_body( 'kitchen-order-list', $orders );
				// Table footer
				self::data_table_footer();
				?>
			</table>
			<?php
		}
		//
		public function branch_order_manage( $date = '' ) {

			$Components = new Components();

			// Get current date
			$currentDate = self::getCurrentDate();
		    $displayCurrentDate = self::getDisplayCurrentDate();

			// Order query args
			$orderArgs = array(
				'limit' => '-1',
				'date_created' => isset( $date ) && !empty( $date ) ? esc_html( $date ) : esc_html( $currentDate )
			);

	      	// Check branch type
	      	if( restrofood_is_multi_branch() ) {

				// Get branch
			    $currentUser = get_current_user_id();

				$args = array (
				  'post_type'        => 'branches',
				  'post_status'      => 'publish',
				  'meta_key'         => 'restrofoodbranch_manager',
				  'meta_value'       => esc_html( $currentUser ),
				  'meta_compare' => 'LIKE'
				);

				$getBranches = get_posts( $args );

				$getBranchesId	 = array_column( $getBranches, 'ID' );
				$getBranchesId	 = !empty( $getBranchesId[0] ) ? $getBranchesId[0] : '';
				$getBranchesName = array_column( $getBranches, 'post_title' );
				$getBranchesName = !empty( $getBranchesName[0] ) ? $getBranchesName[0] : '';
				// Set branch id in order args
				$orderArgs['branch'] = esc_html( $getBranchesId );

	      	}

	        $orders = wc_get_orders( $orderArgs );

			?>
			<div class="rb_row">
				<div class="rb_col_12">
					<?php 
					$date = !empty( $date ) ? $date : $displayCurrentDate;
					//
					if( restrofood_is_multi_branch() ):
					?>
					<h4 class="bf-order-title rb_text_center rb_mb_20"><?php echo sprintf( esc_html__( 'Welcome To %s Branch' ), esc_html( $getBranchesName ) ); ?> </h4>
					<?php
					endif;
					?>
					<h5 class="bf-order-title rb_text_center rb_mb_50"><?php esc_html_e( 'Date:', 'restrofood' ); ?> <?php echo esc_html( $date ); ?></h5>
				</div>
			</div>
			
			<div class="branch-order">
				<div class="statistics-area">
					<div class="rb_row">
						<div class="rb_col_lg_2 rb_col_sm_6 rb_col-12">
							<div class="rb_card rb_mb_30">
								<div class="rb_card_title rb_mb_0">
									<h3 class="fz-30 total_order-total_count rb_mb_15" ></h3>
									<h5><?php esc_html_e( 'Total Order', 'restrofood' ); ?></h5>	
								</div>
							</div>
						</div>
						<div class="rb_col_lg_2 rb_col_sm_6 rb_col-12">
							<div class="rb_card rb_mb_30">
								<div class="rb_card_title rb_mb_0">
									<h3 class="fz-30 completed_order-total_count rb_mb_15"></h3>
									<h5><?php esc_html_e( 'Total Completed Order', 'restrofood' ); ?></h5>
								</div>
							</div>
						</div>
						<div class="rb_col_lg_2 rb_col_sm_6 rb_col-12">
							<div class="rb_card rb_mb_30">
								<div class="rb_card_title rb_mb_0">
									<h3 class="fz-30 cancel_order-total_count rb_mb_15"></h3>
									<h5><?php esc_html_e( 'Total Cancel Order', 'restrofood' ); ?></h5>
								</div>
							</div>
						</div>
						<div class="rb_col_lg_2 rb_col_sm_6 rb_col-12">
							<div class="rb_card rb_mb_30">
								<div class="rb_card_title rb_mb_0">
									<h3 class="fz-30 rb_mb_15"><span class="total_order-total_value"></span></h3>
									<h5><?php esc_html_e( 'Total Value', 'restrofood' ); ?></h5>
								</div>
							</div>
						</div>
						<div class="rb_col_lg_2 rb_col_sm_6 rb_col-12">
							<div class="rb_card rb_mb_30">
								<div class="rb_card_title rb_mb_0">
									<h3 class="fz-30 rb_mb_15"><span class="completed_order-total_value"></span></h3>
									<h5><?php esc_html_e( 'Total Completed Order Value', 'restrofood' ); ?></h5>
								</div>
							</div>
						</div>
						<div class="rb_col_lg_2 rb_col_sm_6 rb_col-12">
							<div class="rb_card rb_mb_30">
								<div class="rb_card_title rb_mb_0">
									<h3 class="fz-30 rb_mb_15"><span class="cancel_order-total_value"></span></h3>
									<h5><?php esc_html_e( 'Total Cancel Order Value', 'restrofood' ); ?></h5>
								</div>
							</div>
						</div>
					</div>
				</div>
				<div class="rb_row">
					<div class="rb_col_12">
						<div class="fb-order-notification"></div>
					</div>
				</div>
			</div>
			<table class="wp-list-table widefat responsive restrofood-order-data-table fixed restrofood-order-list">
				<?php
				// Table header 
				self::data_table_header();
				// Table body
				self::data_table_body( 'branch-order-list', $orders );
				// Table footer
				self::data_table_footer();
				?>
			</table>
			<?php
		}
		//
		public function delivery_order_manage( $date = '' ) {
		
			// Get current date
			$currentDate = self::getCurrentDate();
		    $displayCurrentDate = self::getDisplayCurrentDate();

			$currentUser = get_current_user_id();

		      // Get branch      
		        $args = array(
		          'limit' 		  => '-1',
		          'date_created'  => !empty( $date ) ? esc_html( $date ) : esc_html( $currentDate ),
		          'delivery_boy'  => esc_html( $currentUser )
		          
		        );

		        $orders = wc_get_orders( $args );

			?>
			<div class="kitchen-order">
				<div class="rb_row">
					<div class="rb_col_12">
						<?php 
						$date = !empty( $date ) ? $date : $displayCurrentDate ;
						?>
						<h4 class="bf-order-title rb_text_center rb_mb_50"><?php esc_html_e( 'Order List :', 'restrofood' ); ?> <?php echo esc_html( $date ); ?></h4>
					</div>
				</div>
			</div>
			<table class="wp-list-table widefat responsive restrofood-order-data-table fixed restrofood-order-list">
				<?php 
				// Table header 
				self::data_table_header();
				// Table body
				self::data_table_body( 'kitchen-order-list', $orders );
				// Table footer
				self::data_table_footer();
				?>
			</table>
			<?php
		}
		//
		public function pre_order_date_filter( $date = '', $preorder = '' ) {

			$wooArgs = ['limit' => '-1'];

		    // Check branch type
		    if( restrofood_is_multi_branch() ) {

		        //
		        $wooArgs['branch'] = esc_html( restrofood_get_current_branch_id_by_manager() ); // Branch id

		        if( !empty( $date ) && !$preorder ) {
		        	$wooArgs['delivery_date'] = esc_html( $date );
		        }
		        if( !empty( $preorder ) ) {
		        	$wooArgs['pre_order_status'] = esc_html( $preorder );
		        }

		    } else {

		      	if( !empty( $date ) && !$preorder ) {
		        	$wooArgs['delivery_date'] = esc_html( $date );
		        }
		        if( !empty( $preorder ) ) {
		        	$wooArgs['pre_order_status'] = esc_html( $preorder );
		        }

		    }

		      $orders = wc_get_orders( $wooArgs );

		      ?>
				<table class="wp-list-table widefat responsive restrofood-order-data-table fixed restrofood-order-list">
			        <thead>
			          <tr>
			            <th><?php esc_html_e( 'Order Id', 'restrofood' ); ?></th>
			            <th><?php esc_html_e( 'Order Date', 'restrofood' ); ?></th>
			            <th><?php esc_html_e( 'Delivery Date/Time', 'restrofood' ); ?></th>
			            <th><?php esc_html_e( 'Delivery Type', 'restrofood' ); ?></th>
			            <th><?php esc_html_e( 'Tracking Status', 'restrofood' ); ?></th>
			            <th><?php esc_html_e( 'View Order', 'restrofood' ); ?></th> 
			          </tr>
			        </thead>

			        <tbody>
			          <?php
			              if( !empty( $orders ) ) {

			                foreach( $orders as $order ) {

			                  $order_id = $order->get_id();
			                  $paymentMethod = $order->get_payment_method_title();

			                  $status = get_post_meta( absint( $order_id ), '_order_tracking_status', true );
			                  $preOrder       = get_post_meta( absint( $order_id ), '_pre_order_status', true );
			                  $delivery_type  = get_post_meta( absint( $order_id ) , '_delivery_type', true );
			                  $delivery_date  = get_post_meta( absint( $order_id ) , '_delivery_date', true );
			                  $delivery_time  = get_post_meta( absint( $order_id ) , '_pickup_time', true );

			                  $time = get_post_meta( absint( $order_id ), '_order_tracking_status_time', true );

			                  $getTime = restrofood_time_elapsed_string( $time , true );
			                  $orderDate = $order->get_date_created()->format ('M-d-Y');

			                  ?>
			                  <tr>
			                    <td><?php echo esc_html( '#'.absint( $order_id ) ); ?></td>
			                    <td><?php echo esc_html( $orderDate ); ?></td>
			                    <td>
								    <?php 
					                  $preOrderClass = '';
					                  if( !empty( $preOrder ) && $preOrder == 'PO' ) {
					                    $preOrderClass = 'pre-order';
					                    echo esc_html( restrofood_date_format( $delivery_date, '' ) .' - '.$delivery_time ); 
					                  } else {
					                    echo esc_html( $orderDate );
					                  }
					                ?>	
			                    </td>
			                    <td><?php echo esc_html( $delivery_type ); ?></td>
			                    <td>
								    <span class="order-status"><?php echo esc_html( restrofood_converted_tracking_status( $status )  ); ?></span>
					                <?php 
					                if( !empty( $preOrder ) && $preOrder == 'PO' ):
					                ?>
					                <span class="order-status <?php echo esc_html( $preOrderClass ); ?>"><?php echo esc_html( restrofood_converted_tracking_status( $preOrder )  ); ?></span>
					                <?php 
					                endif;
					                ?>
			                    	<br>
			                    	<span class="time-status"><?php echo esc_html( $getTime ); ?></span>
			                    </td>
			                    <td>
			                    <button class="rb_btn_fill fill_sm fb-view-order" data-order-id="<?php echo esc_attr( $order_id ); ?>"><?php esc_html_e( 'View Details', 'restrofood' ); ?></button>
			                    </td>
			                  </tr>
			                  <?php
			                  
			                }

			              } else {
			              	echo '<td valign="top" colspan="7" class="dataTables_empty">'.esc_html__( 'No order found', 'restrofood' ).'</td>';
			              }
			              ?>

			        </tbody>
			        <tfoot>
			          <tr>            
			            <th><?php esc_html_e( 'Order Id', 'restrofood' ); ?></th>
			            <th><?php esc_html_e( 'Order Date', 'restrofood' ); ?></th>
			            <th><?php esc_html_e( 'Delivery Date/Time', 'restrofood' ); ?></th>
			            <th><?php esc_html_e( 'Delivery Type', 'restrofood' ); ?></th>
			            <th><?php esc_html_e( 'Tracking Status', 'restrofood' ); ?></th>
			            <th><?php esc_html_e( 'View Order', 'restrofood' ); ?></th> 
			          </tr>
			        </tfoot>

			    </table>
		      <?php

		}
		//
		public function admin_branches_manage() {
			// get current date
		    $displayCurrentDate = self::getDisplayCurrentDate();
			?>
			<div class="container-fluid">
				<div class="restrofood-wrapper">
					<div class="fb-tab-content">
						<div class="container-fluid">
							<div class="row">
								<div class="col-12">
									<?php do_action( 'restrofood_branche_mange_header_name' ); ?>									
									<h2 class="current-date-title"><?php esc_html_e( 'Date:', 'restrofood' ); ?> <span class="current-date"><?php echo esc_html( $displayCurrentDate ); ?></span></h2>
								</div>
								<div class="col-lg-6 col-12">
									<?php
										$Components = new Components();
										$Components->admin_filter_form_html();
									?>
								</div>
								<div class="col-lg-6 col-12">
									<?php
										$Components->preorder_filter_form_html();
									?>
								</div>
							</div>
							<div class="statistics-area">
								<div class="row">
									<div class="col-lg-2 col-sm-6 col-12">
										<div class="fb-single-Statistics">
											<h2 class="total_order-total_count" ></h2>
											<h4><?php esc_html_e( 'Total Order', 'restrofood' ); ?></h4>
										</div>
									</div>
									<div class="col-lg-2 col-sm-6 col-12">
										<div class="fb-single-Statistics">
											<h2 class="completed_order-total_count"></h2>
											<h4><?php esc_html_e( 'Total Completed Order', 'restrofood' ); ?></h4>
										</div>
									</div>
									<div class="col-lg-2 col-sm-6 col-12">
										<div class="fb-single-Statistics">
											<h2 class="cancel_order-total_count"></h2>
											<h4><?php esc_html_e( 'Total Cancel Order', 'restrofood' ); ?></h4>
										</div>
									</div>
									<div class="col-lg-2 col-sm-6 col-12">
										<div class="fb-single-Statistics">
											<h2><span class="total_order-total_value"></span></h2>
											<h4><?php esc_html_e( 'Total Value', 'restrofood' ); ?></h4>
										</div>
									</div>
									<div class="col-lg-2 col-sm-6 col-12">
										<div class="fb-single-Statistics">
											<h2><span class="completed_order-total_value"></span></h2>
											<h4><?php esc_html_e( 'Total Completed Order Value', 'restrofood' ); ?></h4>
										</div>
									</div>
									<div class="col-lg-2 col-sm-6 col-12">
										<div class="fb-single-Statistics">
											<h2><span class="cancel_order-total_value"></span></h2>
											<h4><?php esc_html_e( 'Total Cancel Order Value', 'restrofood' ); ?></h4>
										</div>
									</div>
								</div>
							</div>
							<div class="container-fluid">
								<div class="row">
									<div class="col-12">
										<div class="order-tbl">
											<div class="branch-order">
												<div class="row">
													<div class="col-12">
														<div class="fb-order-notification"></div>
													</div>
												</div>
											</div>
											<div id="dtable"></div>
										</div>
									</div>
								</div>
							</div>
						</div>
					</div>
				</div>
			</div>
			
			<?php
		}

		/**
		 * data_table_header  data table header markup
		 * @return html
		 */
		public static function data_table_header() {
			?>
			<thead>
				<tr>
					<th><?php esc_html_e( 'Order Id', 'restrofood' ); ?></th>
					<th><?php esc_html_e( 'Order Date', 'restrofood' ); ?></th>
					<th><?php esc_html_e( 'Delivery Date/Time', 'restrofood' ); ?></th>
					<th><?php esc_html_e( 'Delivery Type', 'restrofood' ); ?></th>
					<th><?php esc_html_e( 'Payment Method/Status', 'restrofood' ); ?></th>
					<th><?php esc_html_e( 'Tracking Status', 'restrofood' ); ?></th>
					<th><?php esc_html_e( 'View Order', 'restrofood' ); ?></th>	
				</tr>
			</thead>
			<?php
		}
		/**
		 * data_table_footer data table footer markup
		 * @return html
		 */
		public static function data_table_footer() {
			?>
			<tfoot>
				<tr>						
					<th><?php esc_html_e( 'Order Id', 'restrofood' ); ?></th>
					<th><?php esc_html_e( 'Order Date', 'restrofood' ); ?></th>
					<th><?php esc_html_e( 'Delivery Date/Time', 'restrofood' ); ?></th>
					<th><?php esc_html_e( 'Delivery Type', 'restrofood' ); ?></th>
					<th><?php esc_html_e( 'Payment Method/Status', 'restrofood' ); ?></th>
					<th><?php esc_html_e( 'Tracking Status', 'restrofood' ); ?></th>
					<th><?php esc_html_e( 'View Order', 'restrofood' ); ?></th>	
				</tr>
			</tfoot>
			<?php
		}
		/**
		 * data_table_body data table body
		 * @param  [type] $orders [description]
		 * @return html
		 */
		public static function data_table_body( $tableId, $orders ) {
			?>
			<tbody id="<?php echo esc_attr( $tableId ); ?>">
				<?php
		        if( !empty( $orders ) ) {

		          foreach( $orders as $order ) {

		          	$order_id = $order->get_id();
		          	$paymentMethod = $order->get_payment_method_title();
		          	$wcOrderStatus = $order->get_status();

		            $status 		= get_post_meta( absint( $order_id ), '_order_tracking_status', true );
		            $preOrder 		= get_post_meta( absint( $order_id ), '_pre_order_status', true );
		            $delivery_type  = get_post_meta( absint( $order_id ) , '_delivery_type', true );
		            $delivery_date  = get_post_meta( absint( $order_id ) , '_delivery_date', true );
		            $deliveryDisplaydate = restrofood_display_date( $delivery_date );
		            $delivery_time  = get_post_meta( absint( $order_id ) , '_pickup_time', true );
		            $orderDate 		= $order->get_date_created()->format ('M-d-Y');
		            $orderDisplayDate = restrofood_display_date( $orderDate );
		            $orderTime 		= $order->get_date_created()->format ( restrofood_time_format() );

		            $time 	 = get_post_meta( absint( $order_id ), '_order_tracking_status_time', true );
		            $getTime = restrofood_time_elapsed_string( $time , true );

		            ?>
		            <tr>
		              <td><?php echo esc_html( '#'.absint( $order_id ) ); ?></td>
		              <td><?php echo esc_html( $orderDisplayDate.' '.$orderTime ); ?></td>
		              <td>
		              	<?php 
		              	$preOrderClass = '';
		              	if( !empty( $preOrder ) && $preOrder == 'PO' ) {
		              		$preOrderClass = 'pre-order';
		              		echo esc_html( $deliveryDisplaydate.' - '.$delivery_time ); 
		              	} else {
		              		echo esc_html( $orderDisplayDate .' - '.$delivery_time );
		              	}
		              	?>
		              </td>
		              <td><?php echo esc_html( $delivery_type ); do_action( 'restrofood_order_table_delivery_type_td', $order_id ); ?></td>
		             	<td>
		              	<?php 
		                echo sprintf( esc_html__( "Method: %s", "restrofood" ), $paymentMethod );
		                echo '<br>';
		                echo sprintf( esc_html__( "Status: %s", "restrofood" ), $wcOrderStatus ); 
		                ?>
		          		</td>
		              <td>
		              	<span class="order-status <?php echo esc_attr( strtolower( $status ).'-status' ); ?>"><?php echo esc_html( restrofood_converted_tracking_status( $status )  ); ?></span>
		              	<?php 
		                if( !empty( $preOrder ) && $preOrder == 'PO' ):
		                ?>
		              	<span class="order-status <?php echo esc_html( $preOrderClass ); ?>"><?php echo esc_html( restrofood_converted_tracking_status( $preOrder )  ); ?></span>
		              	<?php 
		              	endif;
		              	?>
		              	<br>
		              	<span class="time-status"><?php echo esc_html( $getTime ); ?></span>
		              </td>
		              <td>
						<button class="rb_btn_fill fill_sm fb-view-order" data-order-id="<?php echo esc_attr( $order_id ); ?>"><?php esc_html_e( 'View Details', 'restrofood' ); ?></button>
		              </td>
		            </tr>
		            <?php
		            
		          }

		        }
		      	?>
			</tbody>
			<?php
		}


	}

}
