#[test_only]
module lend_x_change::lending_contract_v2_tests {
    use lend_x_change::{
        version::Version,
        configuration::Configuration,
        state::State,
        asset_tier::{Self, AssetTier, AssetTierKey},
        offer_registry::{Self, OfferKey, Offer},
    };
    use sui::test_scenario;
    use sui::object::{Self, UID};
    use sui::transfer;
    use std::debug;

    #[test_only]
    public struct TestAssetTier has key, store {
        id: UID,
    }

    #[test_only]
    public struct TestCoinType has key, store {
        id: UID,
    }
    #[test_only]
    public struct TestCoinType2 has key, store {
        id: UID,
    }

    const ENotImplemented: u64 = 0;

    #[test]
    fun test_create_asset_tier() {
        let addr1 = @0xA;
        let mut scenario = test_scenario::begin(addr1);
        test_scenario::next_tx(&mut scenario, addr1);
            {
                let ctx = test_scenario::ctx(&mut scenario);
                let asset_tier_name = b"Test_asset_tier_name".to_string();
                let asset_tier_amount = 100;
                let asset_tier_duration = 3600;
                let lend_token = b"Test_lend_token".to_string();

                let new_asset_tier = asset_tier::new(asset_tier_name, asset_tier_amount, asset_tier_duration, lend_token, ctx);
                assert!(asset_tier::get_amount<TestCoinType>(&new_asset_tier) == asset_tier_amount, 0);
                assert!(asset_tier::get_duration<TestCoinType>(&new_asset_tier) == asset_tier_duration, 0);
                transfer::public_transfer(new_asset_tier, addr1);
            };
        test_scenario::end(scenario); 
    }

    #[test]
    fun test_create_offer() {
        let addr1 = @0xA;
        let mut scenario = test_scenario::begin(addr1);
        test_scenario::next_tx(&mut scenario, addr1);
            {
                let ctx = test_scenario::ctx(&mut scenario);
                let asset_tier = TestAssetTier { id: object::new(ctx) };
                let asset_tier_id = object::id(&asset_tier);
                let offer = offer_registry::new_offer<TestCoinType>(asset_tier_id, b"Test_asset_tier_name".to_string(), 100, 3600, 5, addr1, ctx);

                assert!(offer_registry::get_asset_tier(&offer) == object::id(&asset_tier), 0);
                assert!(offer_registry::get_amount(&offer) == 100, 0);
                assert!(offer_registry::get_duration(&offer) == 3600, 0);
                assert!(offer_registry::get_interest(&offer) == 5, 0);
                let status = offer_registry::get_status(&offer);
                
                assert!(status == b"Created".to_string(), 0);
                assert!(offer_registry::get_lender(&offer) == addr1, 0);
                transfer::transfer(asset_tier, addr1);
                transfer::public_transfer(offer, addr1);
            };
        test_scenario::end(scenario); 
    }

    #[test]
    fun test_request_cancel_offer() {
        let addr1 = @0xA;
        let mut scenario = test_scenario::begin(addr1);
        test_scenario::next_tx(&mut scenario, addr1);
            {
                let ctx = test_scenario::ctx(&mut scenario);
                let asset_tier = TestAssetTier { id: object::new(ctx) };
                let asset_tier_id = object::id(&asset_tier);
                let mut offer = offer_registry::new_offer<TestCoinType>(asset_tier_id, b"Test_asset_tier_name".to_string(), 100, 3600, 5, addr1, ctx);

                assert!(offer_registry::get_asset_tier(&offer) == object::id(&asset_tier), 0);
                assert!(offer_registry::get_amount(&offer) == 100, 0);
                assert!(offer_registry::get_duration(&offer) == 3600, 0);
                assert!(offer_registry::get_interest(&offer) == 5, 0);
                let status = offer_registry::get_status(&offer);
                
                assert!(status == b"Created".to_string(), 0);
                assert!(offer_registry::get_lender(&offer) == addr1, 0);

                offer_registry::cancel_offer(&mut offer, addr1);

                let status = offer_registry::get_status(&offer);
                
                assert!(status == b"Cancelling".to_string(), 0);
                transfer::transfer(asset_tier, addr1);
                transfer::public_transfer(offer, addr1);
            };
        test_scenario::end(scenario);
    }

    #[test]
    fun test_edit_offer() {
        let addr1 = @0xA;
        let mut scenario = test_scenario::begin(addr1);
        test_scenario::next_tx(&mut scenario, addr1);
            {
                let ctx = test_scenario::ctx(&mut scenario);
                let asset_tier = TestAssetTier { id: object::new(ctx) };
                let asset_tier_id = object::id(&asset_tier);
                let mut offer = offer_registry::new_offer<TestCoinType>(asset_tier_id, b"Test_asset_tier_name".to_string(), 100, 3600, 5, addr1, ctx);

                assert!(offer_registry::get_asset_tier(&offer) == object::id(&asset_tier), 0);
                assert!(offer_registry::get_amount(&offer) == 100, 0);
                assert!(offer_registry::get_duration(&offer) == 3600, 0);
                assert!(offer_registry::get_interest(&offer) == 5, 0);
                let status = offer_registry::get_status(&offer);
                
                assert!(status == b"Created".to_string(), 0);
                assert!(offer_registry::get_lender(&offer) == addr1, 0);

                offer_registry::edit_offer(&mut offer, 200, addr1);

                assert!(offer_registry::get_interest(&offer) == 200, 0);

                transfer::transfer(asset_tier, addr1);
                transfer::public_transfer(offer, addr1);
            };
        test_scenario::end(scenario); 
    }
    
    #[test, expected_failure(abort_code = ::lend_x_change::lending_contract_v2_tests::ENotImplemented)]
    fun test_lending_contract_v2_fail() {
        abort ENotImplemented
    }
}
