package clublink.golfrules.playtrack;

import com.getcapacitor.BridgeActivity;
import com.getcapacitor.Plugin;

public class MainActivity extends BridgeActivity {
    public MainActivity() {
        super();
        registerPlugin(BackgroundLocation.class);
    }
}


